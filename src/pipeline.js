import { extractDataFromImage } from './geminiClient.js';
import { calculateInvoice, validateInvoice } from './gstEngine.js';
import { generatePDF } from './pdfGenerator.js';
import { generateTallyXML, validateTallyXML } from './tallyXml.js';
import { writeFileSync } from 'fs';

/**
 * Complete pipeline: Image → OCR → GST → PDF + XML
 * @param {Buffer} imageBuffer - Image buffer from Telegram
 * @param {string} documentType - 'sales_invoice', 'purchase_order', 'delivery_challan'
 * @param {string} customerState - Customer's state (optional)
 * @returns {Promise<Object>} { invoice, pdfBuffer, xmlString, metadata }
 */
export async function processInvoicePipeline(imageBuffer, documentType = 'sales_invoice', customerState = null) {
  const startTime = Date.now();
  const metadata = {
    documentType,
    startTime: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Extract data with Gemini Vision OCR
    console.log('📸 Step 1: Extracting data from image...');
    const stepStart = Date.now();

    const extractedData = await extractDataFromImage(imageBuffer);

    metadata.steps.push({
      step: 'OCR',
      duration: Date.now() - stepStart,
      confidence: extractedData.confidence,
      itemsFound: extractedData.items?.length || 0
    });

    console.log(`✅ OCR complete (${metadata.steps[0].duration}ms, confidence: ${extractedData.confidence})`);

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

    // Step 4: Generate PDF
    console.log('📑 Step 4: Generating PDF...');
    const pdfStart = Date.now();

    const pdfBuffer = await generatePDF(invoiceData, documentType);

    metadata.steps.push({
      step: 'PDF Generation',
      duration: Date.now() - pdfStart,
      size: pdfBuffer.length
    });

    console.log(`✅ PDF generated (${metadata.steps[2].duration}ms, ${pdfBuffer.length} bytes)`);

    // Step 5: Generate Tally XML
    console.log('📄 Step 5: Generating Tally XML...');
    const xmlStart = Date.now();

    const voucherType = documentType === 'purchase_order' ? 'Purchase' : 'Sales';
    const xmlString = generateTallyXML(invoiceData, voucherType);

    // Validate XML
    const xmlValidation = validateTallyXML(xmlString);
    if (!xmlValidation.valid) {
      console.warn('⚠️ XML validation warnings:', xmlValidation.errors);
    }

    metadata.steps.push({
      step: 'XML Generation',
      duration: Date.now() - xmlStart,
      size: xmlString.length,
      valid: xmlValidation.valid
    });

    console.log(`✅ XML generated (${metadata.steps[3].duration}ms, ${xmlString.length} bytes)`);

    // Complete metadata
    metadata.totalDuration = Date.now() - startTime;
    metadata.endTime = new Date().toISOString();
    metadata.success = true;

    console.log(`\n✨ Pipeline complete in ${metadata.totalDuration}ms`);

    return {
      success: true,
      invoice: invoiceData,
      extractedData,
      pdfBuffer,
      xmlString,
      metadata
    };

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
  const message = `
✅ *Invoice ${invoice.invoice_number || 'N/A'} Created!*

👤 *Customer:* ${invoice.customer_name}
📅 *Date:* ${invoice.date}
📍 *Tax Type:* ${invoice.tax_type.toUpperCase()}

*Items:* ${invoice.items.length}
${invoice.items.map((item, i) => `${i + 1}. ${item.name} - ${item.quantity} ${item.unit} @ ₹${item.rate}`).join('\n')}

💰 *Subtotal:* ₹${invoice.subtotal.toLocaleString('en-IN')}
${invoice.tax_type === 'intrastate' ?
  `📊 *CGST (${invoice.items[0]?.gst_rate / 2 || 9}%):* ₹${invoice.cgst.toLocaleString('en-IN')}\n📊 *SGST (${invoice.items[0]?.gst_rate / 2 || 9}%):* ₹${invoice.sgst.toLocaleString('en-IN')}` :
  `📊 *IGST (${invoice.items[0]?.gst_rate || 18}%):* ₹${invoice.igst.toLocaleString('en-IN')}`
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
