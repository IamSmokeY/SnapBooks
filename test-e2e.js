// End-to-end test: Image → OCR → GST → PDF
import { readFileSync, writeFileSync } from 'fs';
import { extractDataFromImage } from './src/geminiClient.js';
import { calculateInvoice, validateInvoice } from './src/gstEngine.js';
import { generatePDF, generateHTMLPreview } from './src/pdfGenerator.js';

console.log('🧪 Starting End-to-End Test\n');
console.log('Testing: Image OCR → GST Calculation → PDF Generation\n');
console.log('='.repeat(60));

async function runE2ETest() {
  try {
    // Step 1: Load test image
    console.log('\n📸 Step 1: Loading test image...');
    const imagePath = './WhatsApp Image 2026-02-14 at 10.38.47.jpeg';
    const imageBuffer = readFileSync(imagePath);
    console.log(`✅ Image loaded: ${imageBuffer.length} bytes`);

    // Step 2: Extract data with Gemini
    console.log('\n🤖 Step 2: Extracting data with Gemini Vision API...');
    const extractedData = await extractDataFromImage(imageBuffer);
    console.log('✅ Data extracted successfully!');
    console.log('\nExtracted Data:');
    console.log(JSON.stringify(extractedData, null, 2));

    // Step 3: Calculate GST and invoice
    console.log('\n💰 Step 3: Calculating GST and invoice totals...');
    const invoiceData = calculateInvoice(extractedData, 'Maharashtra');
    console.log('✅ Invoice calculated successfully!');
    console.log('\nInvoice Summary:');
    console.log(`  Customer: ${invoiceData.customer_name}`);
    console.log(`  Items: ${invoiceData.items.length}`);
    console.log(`  Tax Type: ${invoiceData.tax_type}`);
    console.log(`  Subtotal: ₹${invoiceData.subtotal.toLocaleString('en-IN')}`);
    console.log(`  CGST: ₹${invoiceData.cgst.toLocaleString('en-IN')}`);
    console.log(`  SGST: ₹${invoiceData.sgst.toLocaleString('en-IN')}`);
    console.log(`  IGST: ₹${invoiceData.igst.toLocaleString('en-IN')}`);
    console.log(`  Grand Total: ₹${invoiceData.grand_total.toLocaleString('en-IN')}`);

    // Step 4: Validate invoice
    console.log('\n✓ Step 4: Validating invoice data...');
    const validation = validateInvoice(invoiceData);
    if (!validation.valid) {
      console.log('❌ Validation failed:');
      validation.errors.forEach(err => console.log(`  - ${err}`));
      throw new Error('Invoice validation failed');
    }
    console.log('✅ Invoice validation passed!');

    // Step 5: Generate HTML preview
    console.log('\n📄 Step 5: Generating HTML preview...');
    const html = generateHTMLPreview(invoiceData, 'sales_invoice');
    writeFileSync('test-output-preview.html', html);
    console.log('✅ HTML preview saved: test-output-preview.html');

    // Step 6: Generate PDF
    console.log('\n📑 Step 6: Generating PDF with Puppeteer...');
    const pdfBuffer = await generatePDF(invoiceData, 'sales_invoice');
    writeFileSync('test-output-invoice.pdf', pdfBuffer);
    console.log(`✅ PDF generated: test-output-invoice.pdf (${pdfBuffer.length} bytes)`);

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ END-TO-END TEST PASSED! ✨');
    console.log('='.repeat(60));
    console.log('\n📦 Output Files:');
    console.log('  1. test-output-preview.html - HTML preview');
    console.log('  2. test-output-invoice.pdf - Final invoice PDF');
    console.log('\n✅ All pipeline components working correctly!');
    console.log('   - Gemini Vision API: ✓');
    console.log('   - GST Calculation: ✓');
    console.log('   - PDF Generation: ✓');
    console.log('\n🚀 Ready for integration into Telegram bot!');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ END-TO-END TEST FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
runE2ETest();
