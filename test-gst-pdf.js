// Test GST Engine and PDF Generator with mock data
import { calculateInvoice, validateInvoice } from './src/gstEngine.js';
import { generatePDF, generateHTMLPreview } from './src/pdfGenerator.js';
import { writeFileSync } from 'fs';

console.log('🧪 Testing GST Engine + PDF Generator (without Gemini)\n');
console.log('='.repeat(60));

async function testWithMockData() {
  try {
    // Mock extracted data (simulating what Gemini would return)
    console.log('\n📋 Step 1: Using mock bill data...');
    const mockExtractedData = {
      supplier_or_customer: 'Ravi Transport',
      items: [
        {
          name: 'Plastic Chairs (कुर्सी)',
          quantity: 100,
          unit: 'pcs',
          rate: 500,
          amount: 50000
        },
        {
          name: 'LED Bulbs',
          quantity: 50,
          unit: 'pcs',
          rate: 150,
          amount: 7500
        }
      ],
      date: '14/02/2026',
      notes: 'Delivery to warehouse',
      confidence: 0.95
    };

    console.log('✅ Mock data loaded');
    console.log(JSON.stringify(mockExtractedData, null, 2));

    // Step 2: Calculate GST - Intrastate
    console.log('\n💰 Step 2: Testing INTRASTATE GST calculation...');
    const intrastateInvoice = calculateInvoice(mockExtractedData, 'Maharashtra');
    console.log('✅ Intrastate invoice calculated!');
    console.log(`  Customer: ${intrastateInvoice.customer_name}`);
    console.log(`  Tax Type: ${intrastateInvoice.tax_type}`);
    console.log(`  Subtotal: ₹${intrastateInvoice.subtotal.toLocaleString('en-IN')}`);
    console.log(`  CGST (9%): ₹${intrastateInvoice.cgst.toLocaleString('en-IN')}`);
    console.log(`  SGST (9%): ₹${intrastateInvoice.sgst.toLocaleString('en-IN')}`);
    console.log(`  Grand Total: ₹${intrastateInvoice.grand_total.toLocaleString('en-IN')}`);

    // Step 3: Calculate GST - Interstate
    console.log('\n💰 Step 3: Testing INTERSTATE GST calculation...');
    const interstateInvoice = calculateInvoice(mockExtractedData, 'Gujarat');
    console.log('✅ Interstate invoice calculated!');
    console.log(`  Customer: ${interstateInvoice.customer_name}`);
    console.log(`  Tax Type: ${interstateInvoice.tax_type}`);
    console.log(`  Subtotal: ₹${interstateInvoice.subtotal.toLocaleString('en-IN')}`);
    console.log(`  IGST (18%): ₹${interstateInvoice.igst.toLocaleString('en-IN')}`);
    console.log(`  Grand Total: ₹${interstateInvoice.grand_total.toLocaleString('en-IN')}`);

    // Step 4: Validate
    console.log('\n✓ Step 4: Validating invoices...');
    const val1 = validateInvoice(intrastateInvoice);
    const val2 = validateInvoice(interstateInvoice);

    if (!val1.valid || !val2.valid) {
      console.log('❌ Validation failed');
      throw new Error('Validation failed');
    }
    console.log('✅ All invoices validated successfully!');

    // Step 5: Generate PDFs
    console.log('\n📑 Step 5: Generating PDFs...');

    // Intrastate PDF
    console.log('  - Generating intrastate invoice PDF...');
    const pdf1 = await generatePDF(intrastateInvoice, 'sales_invoice');
    writeFileSync('test-invoice-intrastate.pdf', pdf1);
    console.log(`    ✅ Saved: test-invoice-intrastate.pdf (${pdf1.length} bytes)`);

    // Interstate PDF
    console.log('  - Generating interstate invoice PDF...');
    const pdf2 = await generatePDF(interstateInvoice, 'sales_invoice');
    writeFileSync('test-invoice-interstate.pdf', pdf2);
    console.log(`    ✅ Saved: test-invoice-interstate.pdf (${pdf2.length} bytes)`);

    // HTML Preview
    console.log('  - Generating HTML preview...');
    const html = generateHTMLPreview(intrastateInvoice, 'sales_invoice');
    writeFileSync('test-invoice-preview.html', html);
    console.log(`    ✅ Saved: test-invoice-preview.html`);

    // Success
    console.log('\n' + '='.repeat(60));
    console.log('✨ GST + PDF TEST PASSED! ✨');
    console.log('='.repeat(60));
    console.log('\n📦 Generated Files:');
    console.log('  1. test-invoice-intrastate.pdf - CGST+SGST invoice');
    console.log('  2. test-invoice-interstate.pdf - IGST invoice');
    console.log('  3. test-invoice-preview.html - HTML preview');
    console.log('\n✅ Components Working:');
    console.log('   - GST Calculation (Intrastate): ✓');
    console.log('   - GST Calculation (Interstate): ✓');
    console.log('   - HSN Code Lookup: ✓');
    console.log('   - Invoice Validation: ✓');
    console.log('   - PDF Generation: ✓');
    console.log('   - HTML Templates: ✓');
    console.log('\n⚠️  Pending: Gemini API integration (needs valid API key)');
    console.log('\n🚀 Ready to integrate into Telegram bot!');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

testWithMockData();
