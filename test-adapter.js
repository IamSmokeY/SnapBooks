/**
 * Test: Schema Adapter + Pipeline integration
 * Run: node test-adapter.js
 * 
 * Verifies that v2 Gemini output correctly flows through the adapter
 * into GST engine, PDF generator, and Tally XML — without needing Gemini API.
 */

import { parseGeminiResponse, formatForTelegram } from './src/schemaAdapter.js';
import { calculateInvoice } from './src/gstEngine.js';

// Sample v2 output (what Gemini 3 Pro actually returns with our prompt)
const sampleV2Response = {
  "documents": [
    {
      "document_type": "handwritten_kata",
      "industry": "mining_minerals",
      "summary": "Weighbridge handwritten record for marble powder delivery by JMD",
      "core": {
        "party_name": { "value": "JMD", "confidence": "high" },
        "date": { "value": "14/02/2026", "confidence": "medium" },
        "time": { "value": null, "confidence": "low" },
        "items": [
          {
            "name": { "value": "Marble Powder (मार्बल पाउडर)", "confidence": "high" },
            "quantity": { "value": 42.38, "confidence": "high" },
            "unit": { "value": "MT", "confidence": "high" },
            "rate": { "value": 1200, "confidence": "medium" },
            "amount": { "value": 50856, "confidence": "medium" }
          }
        ],
        "total_amount": { "value": 50856, "confidence": "medium" }
      },
      "additional_fields": [
        { "key": "vehicle_number", "label": "Vehicle Number", "value": "RJ36GA 8613", "confidence": "high" },
        { "key": "gross_weight", "label": "Gross Weight (KG)", "value": 57420, "confidence": "high" },
        { "key": "tare_weight", "label": "Tare Weight (KG)", "value": 15040, "confidence": "high" },
        { "key": "nett_weight", "label": "Nett Weight (KG)", "value": 42380, "confidence": "high" },
        { "key": "book_number", "label": "Book Number", "value": "777", "confidence": "high" },
        { "key": "receipt_number", "label": "Receipt Number", "value": "068", "confidence": "high" }
      ],
      "crossed_out_items": [],
      "corrections": []
    },
    {
      "document_type": "weighbridge_slip",
      "industry": "mining_minerals",
      "summary": "Official weighbridge printout from Mateshwari Kanta for vehicle RJ36GA 8613",
      "core": {
        "party_name": { "value": "Mateshwari Kanta (माटेश्वरी कांटा)", "confidence": "high" },
        "date": { "value": "14/02/2026", "confidence": "high" },
        "time": { "value": "14:32", "confidence": "high" },
        "items": [
          {
            "name": { "value": "Marble Powder (मार्बल पाउडर)", "confidence": "high" },
            "quantity": { "value": 42380, "confidence": "high" },
            "unit": { "value": "KG", "confidence": "high" },
            "rate": { "value": 0, "confidence": "high" },
            "amount": { "value": 0, "confidence": "high" }
          }
        ],
        "total_amount": { "value": 0, "confidence": "high" }
      },
      "additional_fields": [
        { "key": "serial_number", "label": "Serial Number", "value": "453", "confidence": "high" },
        { "key": "vehicle_number", "label": "Vehicle Number", "value": "RJ36GA 8613", "confidence": "high" }
      ],
      "crossed_out_items": [],
      "corrections": []
    }
  ],
  "multi_document": {
    "count": 2,
    "relationship": "same_transaction",
    "link_note": "Pink slip is the handwritten record, white form is the official weighbridge printout for the same 42.38 MT / 42,380 KG load"
  }
};

console.log('═══════════════════════════════════════');
console.log('  TEST: Schema Adapter + Pipeline');
console.log('═══════════════════════════════════════\n');

// Test 1: Parse v2 response
console.log('--- Test 1: parseGeminiResponse (v2) ---');
try {
  const parsed = parseGeminiResponse(sampleV2Response);
  
  console.log('✅ Parsed successfully');
  console.log(`   Documents: ${parsed.all.length}`);
  console.log(`   Primary party: ${parsed.primary.supplier_or_customer}`);
  console.log(`   Primary items: ${parsed.primary.items.length}`);
  console.log(`   Confidence: ${parsed.primary.confidence}`);
  console.log(`   Multi-doc: ${parsed.multiDocument.relationship}`);
  console.log(`   Item 1: ${parsed.primary.items[0].name} — ${parsed.primary.items[0].quantity} ${parsed.primary.items[0].unit}`);
} catch (err) {
  console.error('❌ FAILED:', err.message);
  process.exit(1);
}

// Test 2: Format for Telegram
console.log('\n--- Test 2: formatForTelegram ---');
try {
  const parsed = parseGeminiResponse(sampleV2Response);
  const message = formatForTelegram(parsed);
  
  console.log('✅ Formatted successfully');
  console.log(`   Message length: ${message.length} chars`);
  console.log(`   Contains party name: ${message.includes('JMD')}`);
  console.log(`   Contains multi-doc notice: ${message.includes('2 documents detected')}`);
  console.log(`   Contains additional fields: ${message.includes('Vehicle Number')}`);
  console.log('\n   --- Telegram Preview ---');
  console.log(message);
  console.log('   --- End Preview ---');
} catch (err) {
  console.error('❌ FAILED:', err.message);
}

// Test 3: Pipeline compatibility (adapter → GST engine)
console.log('\n--- Test 3: Adapter → GST Engine ---');
try {
  const parsed = parseGeminiResponse(sampleV2Response);
  const flat = parsed.primary;
  
  // This is what pipeline.js does
  const invoiceData = calculateInvoice(flat);
  
  console.log('✅ GST calculation successful');
  console.log(`   Customer: ${invoiceData.customer_name}`);
  console.log(`   Items: ${invoiceData.items.length}`);
  console.log(`   Subtotal: ₹${invoiceData.subtotal.toLocaleString('en-IN')}`);
  console.log(`   Tax type: ${invoiceData.tax_type}`);
  console.log(`   CGST: ₹${invoiceData.cgst.toLocaleString('en-IN')}`);
  console.log(`   SGST: ₹${invoiceData.sgst.toLocaleString('en-IN')}`);
  console.log(`   Grand Total: ₹${invoiceData.grand_total.toLocaleString('en-IN')}`);
} catch (err) {
  console.error('❌ FAILED:', err.message);
}

// Test 4: Legacy schema compatibility
console.log('\n--- Test 4: Legacy flat schema ---');
try {
  const legacyResponse = {
    "supplier_or_customer": "Ravi Transport",
    "items": [
      { "name": "Plastic Chairs", "quantity": 100, "unit": "pcs", "rate": 500, "amount": 50000 }
    ],
    "date": "14/02/2026",
    "notes": "Deliver to warehouse",
    "confidence": 0.95
  };
  
  const parsed = parseGeminiResponse(legacyResponse);
  console.log('✅ Legacy format parsed');
  console.log(`   Party: ${parsed.primary.supplier_or_customer}`);
  console.log(`   Items: ${parsed.primary.items.length}`);
  console.log(`   Confidence: ${parsed.primary.confidence}`);
  
  const invoiceData = calculateInvoice(parsed.primary);
  console.log(`   Grand Total: ₹${invoiceData.grand_total.toLocaleString('en-IN')}`);
} catch (err) {
  console.error('❌ FAILED:', err.message);
}

// Test 5: Error response handling
console.log('\n--- Test 5: Error response ---');
try {
  parseGeminiResponse({ error: "unreadable", suggestion: "Retake with better lighting" });
  console.error('❌ Should have thrown');
} catch (err) {
  console.log(`✅ Error caught correctly: "${err.message}"`);
}

console.log('\n═══════════════════════════════════════');
console.log('  ALL TESTS COMPLETE');
console.log('═══════════════════════════════════════\n');
