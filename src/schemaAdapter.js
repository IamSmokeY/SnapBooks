/**
 * Schema Adapter — Bridges Gemini v2 output to pipeline's flat format
 * 
 * Gemini v2 returns: { documents: [{ core: { party_name: {value, confidence}, ... } }], multi_document }
 * Pipeline expects:  { supplier_or_customer: "string", items: [{name, quantity, unit, rate, amount}], confidence: 0.95 }
 */

/**
 * Convert per-field confidence tags to a numeric score
 * @param {string} level - "high" | "medium" | "low"
 * @returns {number} 0.0–1.0
 */
function confidenceToNumber(level) {
  const map = { high: 0.95, medium: 0.75, low: 0.50 };
  return map[level] || 0.75;
}

/**
 * Extract a plain value from a v2 confidence-tagged field
 * Handles both { value, confidence } objects and raw values
 * @param {*} field - Either { value: X, confidence: "high" } or a plain value
 * @returns {*} The unwrapped value
 */
function unwrap(field) {
  if (field && typeof field === 'object' && 'value' in field) {
    return field.value;
  }
  return field;
}

/**
 * Extract confidence from a field, defaulting to "high"
 * @param {*} field
 * @returns {string}
 */
function getConfidence(field) {
  if (field && typeof field === 'object' && 'confidence' in field) {
    return field.confidence;
  }
  return 'high';
}

/**
 * Convert a single v2 document to the flat schema the pipeline expects
 * @param {Object} doc - A single document from documents[]
 * @returns {Object} Flat format for pipeline
 */
function flattenDocument(doc) {
  const core = doc.core || {};

  // Flatten items
  const items = [];
  if (core.items && Array.isArray(core.items)) {
    for (const item of core.items) {
      items.push({
        name: unwrap(item.name) || 'Unknown Item',
        quantity: parseFloat(unwrap(item.quantity)) || 0,
        unit: unwrap(item.unit) || 'pcs',
        rate: parseFloat(unwrap(item.rate)) || 0,
        amount: parseFloat(unwrap(item.amount)) || 0
      });
    }
  }

  // Calculate amounts where missing
  for (const item of items) {
    if (item.amount === 0 && item.rate > 0 && item.quantity > 0) {
      item.amount = item.rate * item.quantity;
    }
  }

  // Calculate average confidence across all core fields
  const confidences = [];
  if (core.party_name) confidences.push(confidenceToNumber(getConfidence(core.party_name)));
  if (core.date) confidences.push(confidenceToNumber(getConfidence(core.date)));
  if (core.total_amount) confidences.push(confidenceToNumber(getConfidence(core.total_amount)));
  if (core.items) {
    for (const item of core.items) {
      confidences.push(confidenceToNumber(getConfidence(item.name)));
      confidences.push(confidenceToNumber(getConfidence(item.quantity)));
    }
  }
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0.75;

  // Build notes from additional_fields
  const notes = (doc.additional_fields || [])
    .map(f => `${f.label}: ${f.value}`)
    .join(', ');

  return {
    supplier_or_customer: unwrap(core.party_name) || 'Unknown',
    items,
    date: unwrap(core.date) || null,
    notes: notes || doc.summary || '',
    confidence: Math.round(avgConfidence * 100) / 100,
    // Preserve v2 extras for the Telegram display
    _v2: {
      document_type: doc.document_type || 'other',
      industry: doc.industry || 'general',
      summary: doc.summary || '',
      additional_fields: doc.additional_fields || [],
      crossed_out_items: doc.crossed_out_items || [],
      corrections: doc.corrections || [],
      time: unwrap(core.time) || null,
      total_amount: parseFloat(unwrap(core.total_amount)) || 0
    }
  };
}

/**
 * Parse raw Gemini v2 JSON response into pipeline-ready format
 * Handles both v2 schema (documents[]) and legacy flat schema
 * 
 * @param {Object} raw - Parsed JSON from Gemini
 * @returns {Object} { primary: flatDoc, all: flatDoc[], multiDocument: {...} }
 */
export function parseGeminiResponse(raw) {
  // Detect schema version
  if (raw.documents && Array.isArray(raw.documents)) {
    // V2 schema
    const flattened = raw.documents.map(flattenDocument);
    return {
      primary: flattened[0],
      all: flattened,
      multiDocument: raw.multi_document || { count: 1, relationship: 'single', link_note: null }
    };
  }

  // Legacy flat schema (backwards compatible)
  if (raw.supplier_or_customer || raw.items) {
    return {
      primary: {
        supplier_or_customer: raw.supplier_or_customer || 'Unknown',
        items: (raw.items || []).map(item => ({
          name: item.name || 'Unknown',
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit || 'pcs',
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0
        })),
        date: raw.date || null,
        notes: raw.notes || '',
        confidence: raw.confidence || 0.75,
        _v2: null
      },
      all: null,
      multiDocument: { count: 1, relationship: 'single', link_note: null }
    };
  }

  // Error response from Gemini
  if (raw.error) {
    throw new Error(raw.suggestion || 'Image could not be processed');
  }

  throw new Error('Unrecognized response format from AI');
}

/**
 * Format a parsed response for Telegram display
 * @param {Object} parsed - Output from parseGeminiResponse
 * @returns {string} Markdown-formatted message
 */
export function formatForTelegram(parsed) {
  const doc = parsed.primary;
  const v2 = doc._v2;

  const confidenceEmoji = doc.confidence >= 0.85 ? '🎯' : doc.confidence >= 0.60 ? '⚠️' : '❗';
  const confidenceWarning = doc.confidence < 0.85
    ? '\n\n⚠️ <b>Please verify the data carefully</b>'
    : '';

  let message = `📋 <b>Extracted Data</b>\n\n`;

  // Document type badge (from v2)
  if (v2 && v2.document_type) {
    const typeLabels = {
      handwritten_kata: '✍️ Handwritten Kata',
      weighbridge_slip: '⚖️ Weighbridge Slip',
      tax_invoice: '🧾 Tax Invoice',
      delivery_challan: '🚚 Delivery Challan',
      purchase_order: '📦 Purchase Order',
      receipt: '🧾 Receipt',
      quotation: '📝 Quotation',
      other: '📄 Document'
    };
    message += `<b>Type:</b> ${typeLabels[v2.document_type] || v2.document_type}\n`;
  }

  message += `👤 ${doc.supplier_or_customer || 'Unknown'}\n`;
  message += `📅 ${doc.date || 'Not specified'}\n`;

  if (v2 && v2.summary) {
    message += `📝 ${v2.summary}\n`;
  }

  message += '\n';

  if (doc.items && doc.items.length > 0) {
    doc.items.forEach((item, index) => {
      message += `┌─────────────────────────────\n`;
      message += `│ <b>Item ${index + 1}:</b> ${item.name}\n`;
      message += `│ <b>Qty:</b> ${item.quantity} ${item.unit}\n`;
      if (item.rate > 0) {
        message += `│ <b>Rate:</b> ₹${item.rate}/${item.unit}\n`;
      }
      if (item.amount > 0) {
        message += `│ <b>Amount:</b> ₹${item.amount.toLocaleString('en-IN')}\n`;
      }
      message += `└─────────────────────────────\n\n`;
    });
  }

  // Show key additional fields (from v2)
  if (v2 && v2.additional_fields && v2.additional_fields.length > 0) {
    message += `📎 <b>Additional Details:</b>\n`;
    for (const field of v2.additional_fields.slice(0, 6)) {
      const warn = field.confidence === 'low' ? ' ⚠️' : '';
      message += `  • ${field.label}: ${field.value}${warn}\n`;
    }
    message += '\n';
  }

  // Multi-document notice
  if (parsed.multiDocument && parsed.multiDocument.count > 1) {
    message += `📑 <b>${parsed.multiDocument.count} documents detected</b> (${parsed.multiDocument.relationship})\n`;
    if (parsed.multiDocument.link_note) {
      message += `   ${parsed.multiDocument.link_note}\n`;
    }
    message += '\n';
  }

  // Crossed-out items warning
  if (v2 && v2.crossed_out_items && v2.crossed_out_items.length > 0) {
    message += `🚫 <b>${v2.crossed_out_items.length} crossed-out item(s) found</b> — excluded from totals\n\n`;
  }

  message += `${confidenceEmoji} <b>Confidence:</b> ${Math.round(doc.confidence * 100)}%`;
  message += confidenceWarning;
  message += `\n\n<b>Select document type and confirm:</b>`;

  return message;
}

export default { parseGeminiResponse, formatForTelegram };
