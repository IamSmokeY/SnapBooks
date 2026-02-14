import { extractDataFromImage } from './geminiClient.js';
import { calculateInvoice, validateInvoice } from './gstEngine.js';
import { generatePDF } from './pdfGenerator.js';
import { generateTallyXML, validateTallyXML } from './tallyXml.js';
import { saveInvoice, uploadFile } from './firebaseClient.js';
import { writeFileSync } from 'fs';

/**
 * Escape special Telegram Markdown characters in user-supplied text
 * @param {string} text
 * @returns {string} Escaped text safe for Telegram Markdown
 */
function escapeMarkdown(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

/**
 * Complete pipeline: Image → OCR → GST → PDF + XML
 * @param {Buffer} imageBuffer - Image buffer from Telegram
 * @param {string} documentType - 'sales_invoice', 'purchase_order', 'delivery_challan'
 * @param {string} customerState - Customer's state (optional)
 * @param {Object} options - Pipeline options
 * @param {number} options.timeout - Overall timeout in milliseconds (default: 30000)
 * @param {number} options.ocrTimeout - OCR timeout (default: 25000)
 * @param {Object} options.extractedData - Pre-extracted data to skip OCR (from previous pass)
 * @returns {Promise<Object>} { invoice, pdfBuffer, xmlString, metadata }
 */
export async function processInvoicePipeline(imageBuffer, documentType = 'sales_invoice', customerState = null, options = {}) {
  const { timeout = 30000, ocrTimeout = 25000, userId = null, saveToFirebase = true } = options;
  const startTime = Date.now();
  const metadata = {
    documentType,
    startTime: new Date().toISOString(),
    steps: [],
    timeout,
    ocrTimeout
  };

  try {
    // Wrap entire pipeline in timeout
    return await Promise.race([
      executePipeline(imageBuffer, documentType, customerState, metadata, { ocrTimeout, extractedData: options.extractedData }),
      new Promise((_, reject) =>
        setTimeout(() => {
          const elapsed = Date.now() - startTime;
          reject(new Error(`Pipeline timeout after ${elapsed}ms (limit: ${timeout}ms). Please try again with a clearer photo.`));
        }, timeout)
      )
    ]);
  } catch (error) {
    console.error('❌ Pipeline error:', error);

    metadata.totalDuration = Date.now() - startTime;
    metadata.endTime = new Date().toISOString();
    metadata.success = false;
    metadata.error = error.message;

    return {
      success: false,
      error: error.message,
      metadata
    };
  }
}

/**
 * Execute the pipeline steps
 * @private
 */
async function executePipeline(imageBuffer, documentType, customerState, metadata, options) {
  const { ocrTimeout, extractedData: preExtracted } = options;
  const startTime = Date.now();

  try {
    // Validate inputs
    if (!preExtracted) {
      // Only need imageBuffer if we're running OCR
      if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        throw new Error('Invalid image buffer');
      }
      if (imageBuffer.length === 0) {
        throw new Error('Empty image buffer');
      }
      if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image too large (max 10MB)');
      }
    }

    // Step 1: Extract data with Gemini Vision OCR (or use pre-extracted)
    let extractedData;
    if (preExtracted) {
      console.log('📸 Step 1: Using pre-extracted data (skipping OCR)...');
      extractedData = preExtracted;
      metadata.steps.push({
        step: 'OCR',
        duration: 0,
        confidence: extractedData.confidence,
        itemsFound: extractedData.items?.length || 0,
        skipped: true
      });
      console.log('✅ OCR skipped (data already available)');
    } else {
      console.log('📸 Step 1: Extracting data from image...');
      const stepStart = Date.now();
      extractedData = await extractDataFromImage(imageBuffer, { timeout: ocrTimeout });
      metadata.steps.push({
        step: 'OCR',
        duration: Date.now() - stepStart,
        confidence: extractedData.confidence,
        itemsFound: extractedData.items?.length || 0
      });
      console.log(`✅ OCR complete (${metadata.steps[0].duration}ms, confidence: ${extractedData.confidence})`);
    }

    // Step 2: Calculate GST and invoice totals
    console.log('💰 Step 2: Calculating GST and totals...');
    const gstStart = Date.now();

    const invoiceData = calculateInvoice(extractedData, customerState);

    metadata.steps.push({
      step: 'GST Calculation',
      duration: Date.now() - gstStart,
      taxType: invoiceData.tax_type,
      grandTotal: invoiceData.grand_total
    });

    console.log(`✅ GST calculated (${metadata.steps[1].duration}ms, total: ₹${invoiceData.grand_total})`);

    // Step 3: Validate invoice data
    console.log('✓ Step 3: Validating invoice...');
    const validation = validateInvoice(invoiceData);

    if (!validation.valid) {
      throw new Error(`Invoice validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('✅ Invoice validated');

    // Steps 4 & 5: Generate PDF and XML in parallel for speed
    console.log('📑 Step 4 & 5: Generating PDF and XML in parallel...');
    const generationStart = Date.now();

    const voucherType = documentType === 'purchase_order' ? 'Purchase' : 'Sales';

    // Parallelize PDF and XML generation
    const [pdfBuffer, xmlString] = await Promise.all([
      generatePDF(invoiceData, documentType).catch(err => {
        console.error('PDF generation error:', err);
        throw new Error(`PDF generation failed: ${err.message}`);
      }),
      (async () => {
        const xml = generateTallyXML(invoiceData, voucherType);
        const xmlValidation = validateTallyXML(xml);
        if (!xmlValidation.valid) {
          console.warn('⚠️ XML validation warnings:', xmlValidation.errors);
        }
        return xml;
      })().catch(err => {
        console.error('XML generation error:', err);
        throw new Error(`XML generation failed: ${err.message}`);
      })
    ]);

    const generationDuration = Date.now() - generationStart;

    metadata.steps.push({
      step: 'PDF + XML Generation (Parallel)',
      duration: generationDuration,
      pdfSize: pdfBuffer.length,
      xmlSize: xmlString.length
    });

    console.log(`✅ PDF + XML generated in parallel (${generationDuration}ms, PDF: ${pdfBuffer.length} bytes, XML: ${xmlString.length} bytes)`);

    // Step 6: Save to Firebase (if enabled)
    let pdfUrl = null;
    let xmlUrl = null;

    if (saveToFirebase) {
      try {
        console.log('☁️ Step 6: Uploading to Firebase...');
        const uploadStart = Date.now();

        const invoiceId = invoiceData.invoice_number.replace(/[\/\\]/g, '-');

        // Upload files to Firebase Storage in parallel
        [pdfUrl, xmlUrl] = await Promise.all([
          uploadFile(pdfBuffer, `invoices/pdfs/${invoiceId}.pdf`, 'application/pdf'),
          uploadFile(Buffer.from(xmlString), `invoices/xmls/${invoiceId}.xml`, 'application/xml')
        ]);

        // Save invoice metadata to Firestore
        await saveInvoice(invoiceId, {
          ...invoiceData,
          pdf_url: pdfUrl,
          xml_url: xmlUrl,
          user_id: userId,
          document_type: documentType,
          extracted_data: extractedData
        });

        const uploadDuration = Date.now() - uploadStart;
        metadata.steps.push({
          step: 'Firebase Upload',
          duration: uploadDuration,
          pdfUrl,
          xmlUrl
        });

        console.log(`✅ Uploaded to Firebase (${uploadDuration}ms)`);
      } catch (error) {
        console.error('⚠️ Firebase upload failed:', error.message);
        // Don't fail the pipeline if Firebase fails - just log it
        metadata.firebaseError = error.message;
      }
    }

    // Complete metadata
    metadata.totalDuration = Date.now() - startTime;
    metadata.endTime = new Date().toISOString();
    metadata.success = true;

    console.log(`\n✨ Pipeline complete in ${metadata.totalDuration}ms`);

    // Check if we're approaching timeout
    if (metadata.totalDuration > 25000) {
      console.warn(`⚠️ Pipeline took ${metadata.totalDuration}ms (close to 30s limit)`);
    }

    return {
      success: true,
      invoice: invoiceData,
      extractedData,
      pdfBuffer,
      xmlString,
      pdfUrl,
      xmlUrl,
      metadata
    };

  } catch (error) {
    // Enhanced error reporting
    let userMessage = error.message;

    if (error.message.includes('timeout')) {
      userMessage = 'Processing is taking too long. Please try again with a clearer, smaller photo.';
    } else if (error.message.includes('confidence')) {
      userMessage = 'Could not read the handwriting clearly. Please ensure good lighting and clear text.';
    } else if (error.message.includes('validation')) {
      userMessage = `Invoice validation failed: ${error.message}. Please check the bill details.`;
    } else if (error.message.includes('API key')) {
      userMessage = 'Service configuration error. Please contact support.';
    }

    throw new Error(userMessage);
  }
}

/**
 * Save pipeline outputs to files (for testing)
 * @param {Object} result - Pipeline result
 * @param {string} outputPrefix - File name prefix
 */
export function savePipelineOutputs(result, outputPrefix = 'output') {
  if (!result.success) {
    console.error('Cannot save outputs - pipeline failed');
    return;
  }

  try {
    // Save PDF
    const pdfPath = `${outputPrefix}.pdf`;
    writeFileSync(pdfPath, result.pdfBuffer);
    console.log(`📄 Saved: ${pdfPath}`);

    // Save XML
    const xmlPath = `${outputPrefix}.xml`;
    writeFileSync(xmlPath, result.xmlString);
    console.log(`📄 Saved: ${xmlPath}`);

    // Save invoice JSON
    const jsonPath = `${outputPrefix}.json`;
    writeFileSync(jsonPath, JSON.stringify(result.invoice, null, 2));
    console.log(`📄 Saved: ${jsonPath}`);

    // Save metadata
    const metaPath = `${outputPrefix}-metadata.json`;
    writeFileSync(metaPath, JSON.stringify(result.metadata, null, 2));
    console.log(`📄 Saved: ${metaPath}`);

  } catch (error) {
    console.error('Error saving outputs:', error);
  }
}

/**
 * Send results to Telegram
 * @param {Object} ctx - Telegraf context
 * @param {Object} result - Pipeline result
 * @returns {Promise<void>}
 */
export async function sendResultsToTelegram(ctx, result) {
  if (!result.success) {
    await ctx.replyWithMarkdown(
      `❌ *Processing Failed*\n\n${result.error}\n\nPlease try again with a clearer photo.`
    );
    return;
  }

  const invoice = result.invoice;

  // Success message
  const gstRates = [...new Set(invoice.items.map(i => i.gst_rate))];
  const gstRateLabel = gstRates.length === 1 ? `${gstRates[0]}` : 'Mixed';

  const message = `
✅ *Invoice ${invoice.invoice_number || 'N/A'} Created!*

👤 *Customer:* ${escapeMarkdown(invoice.customer_name)}
📅 *Date:* ${invoice.date}
📍 *Tax Type:* ${invoice.tax_type.toUpperCase()}

*Items:* ${invoice.items.length}
${invoice.items.map((item, i) => `${i + 1}. ${escapeMarkdown(item.name)} - ${item.quantity} ${item.unit} @ ₹${item.rate} (${item.gst_rate}% GST)`).join('\n')}

💰 *Subtotal:* ₹${invoice.subtotal.toLocaleString('en-IN')}
${invoice.tax_type === 'intrastate' ?
  `📊 *CGST:* ₹${invoice.cgst.toLocaleString('en-IN')}\n📊 *SGST:* ₹${invoice.sgst.toLocaleString('en-IN')}` :
  `📊 *IGST:* ₹${invoice.igst.toLocaleString('en-IN')}`
}
💵 *Grand Total:* ₹${invoice.grand_total.toLocaleString('en-IN')}

⏱️ *Processing Time:* ${result.metadata.totalDuration}ms
  `.trim();

  await ctx.replyWithMarkdown(message);

  // Send PDF
  await ctx.replyWithDocument(
    { source: result.pdfBuffer, filename: `${invoice.invoice_number || 'invoice'}.pdf` },
    { caption: '📄 Tax Invoice PDF' }
  );

  // Send XML
  await ctx.replyWithDocument(
    { source: Buffer.from(result.xmlString), filename: `${invoice.invoice_number || 'invoice'}.xml` },
    { caption: '📊 Tally XML (Import Ready)' }
  );

  console.log(`✅ Sent 3 messages to user ${ctx.from.id}`);
}

export default {
  processInvoicePipeline,
  savePipelineOutputs,
  sendResultsToTelegram
};
