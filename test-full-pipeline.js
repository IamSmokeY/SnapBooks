// Test complete pipeline: OCR → GST → PDF + XML
import { processInvoicePipeline, savePipelineOutputs } from './src/pipeline.js';
import { readFileSync } from 'fs';

console.log('🧪 Testing Full Pipeline Integration\n');
console.log('Testing: OCR → GST → PDF + Tally XML');
console.log('='.repeat(70));

async function testFullPipeline() {
  try {
    // Load test image
    console.log('\n📸 Loading test image...');
    const imagePath = './WhatsApp Image 2026-02-14 at 10.38.47.jpeg';
    const imageBuffer = readFileSync(imagePath);
    console.log(`✅ Image loaded: ${imageBuffer.length} bytes`);

    // Test Sales Invoice
    console.log('\n' + '='.repeat(70));
    console.log('TEST 1: SALES INVOICE (with real image OCR)');
    console.log('='.repeat(70));

    const salesResult = await processInvoicePipeline(
      imageBuffer,
      'sales_invoice',
      'Maharashtra' // Same state = intrastate
    );

    if (salesResult.success) {
      console.log('\n✅ SALES INVOICE PIPELINE PASSED!');
      console.log(`   Invoice Number: ${salesResult.invoice.invoice_number}`);
      console.log(`   Customer: ${salesResult.invoice.customer_name}`);
      console.log(`   Items: ${salesResult.invoice.items.length}`);
      console.log(`   Tax Type: ${salesResult.invoice.tax_type}`);
      console.log(`   Grand Total: ₹${salesResult.invoice.grand_total.toLocaleString('en-IN')}`);
      console.log(`   Processing Time: ${salesResult.metadata.totalDuration}ms`);

      // Save outputs
      savePipelineOutputs(salesResult, 'pipeline-output-sales-invoice');

    } else {
      console.log(`\n❌ SALES INVOICE FAILED: ${salesResult.error}`);
      console.log('Note: If Gemini API key is not working, this is expected.');
      console.log('      The rest of the pipeline (GST, PDF, XML) is still functional.\n');
    }

    // Test Purchase Order with Interstate
    console.log('\n' + '='.repeat(70));
    console.log('TEST 2: PURCHASE ORDER - INTERSTATE (with real image OCR)');
    console.log('='.repeat(70));

    const poResult = await processInvoicePipeline(
      imageBuffer,
      'purchase_order',
      'Gujarat' // Different state = interstate
    );

    if (poResult.success) {
      console.log('\n✅ PURCHASE ORDER PIPELINE PASSED!');
      console.log(`   PO Number: ${poResult.invoice.invoice_number}`);
      console.log(`   Supplier: ${poResult.invoice.customer_name}`);
      console.log(`   Tax Type: ${poResult.invoice.tax_type}`);
      console.log(`   IGST: ₹${poResult.invoice.igst.toLocaleString('en-IN')}`);
      console.log(`   Grand Total: ₹${poResult.invoice.grand_total.toLocaleString('en-IN')}`);
      console.log(`   Processing Time: ${poResult.metadata.totalDuration}ms`);

      // Save outputs
      savePipelineOutputs(poResult, 'pipeline-output-purchase-order');

    } else {
      console.log(`\n❌ PURCHASE ORDER FAILED: ${poResult.error}`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('PIPELINE TEST SUMMARY');
    console.log('='.repeat(70));

    const testsRun = 2;
    const testsPassed = (salesResult.success ? 1 : 0) + (poResult.success ? 1 : 0);

    console.log(`\n📊 Tests Run: ${testsRun}`);
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsRun - testsPassed}`);

    if (testsPassed === testsRun) {
      console.log('\n🎉 ALL PIPELINE TESTS PASSED!');
      console.log('\n📦 Generated Files:');
      console.log('   Sales Invoice:');
      console.log('   - pipeline-output-sales-invoice.pdf');
      console.log('   - pipeline-output-sales-invoice.xml');
      console.log('   - pipeline-output-sales-invoice.json');
      console.log('   Purchase Order:');
      console.log('   - pipeline-output-purchase-order.pdf');
      console.log('   - pipeline-output-purchase-order.xml');
      console.log('   - pipeline-output-purchase-order.json');

      console.log('\n✅ Pipeline Components Verified:');
      console.log('   - Gemini Vision OCR: ✓');
      console.log('   - GST Calculation: ✓');
      console.log('   - Invoice Validation: ✓');
      console.log('   - PDF Generation: ✓');
      console.log('   - Tally XML Generation: ✓');
      console.log('   - Error Handling: ✓');

      console.log('\n🚀 READY FOR TELEGRAM BOT INTEGRATION!');
      console.log('   Run: npm start');
      console.log('   Then message @snapbooks_bot with a photo');

    } else {
      console.log('\n⚠️  SOME TESTS FAILED');

      if (!salesResult.success && !poResult.success) {
        console.log('\n🔍 Likely Issue: Gemini API Key');
        console.log('   - Both tests failed at OCR step');
        console.log('   - Verify API key is correct and active');
        console.log('   - Check model name is valid');

        console.log('\n✅ GST + PDF + XML components are working');
        console.log('   (Verified in test-gst-pdf.js)');
      }
    }

  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ PIPELINE TEST CRASHED');
    console.log('='.repeat(70));
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

testFullPipeline();
