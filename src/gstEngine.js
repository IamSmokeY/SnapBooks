import dotenv from 'dotenv';

dotenv.config();

// Business state from environment
const BUSINESS_STATE = process.env.BUSINESS_STATE || 'Maharashtra';

/**
 * HSN Code Database - Common items used in Indian manufacturing
 * In production, this would come from Firestore
 */
const HSN_DATABASE = {
  // Furniture
  'plastic chairs': { hsn: '94036090', gst_rate: 18 },
  'kursi': { hsn: '94036090', gst_rate: 18 },
  'chair': { hsn: '94036090', gst_rate: 18 },
  'table': { hsn: '94033090', gst_rate: 18 },
  'furniture': { hsn: '94036090', gst_rate: 18 },

  // Metals/Steel
  'steel pipes': { hsn: '73063090', gst_rate: 18 },
  'sariya': { hsn: '72142000', gst_rate: 18 },
  'steel bars': { hsn: '72142000', gst_rate: 18 },
  'iron rod': { hsn: '72142000', gst_rate: 18 },
  'metal pipe': { hsn: '73063090', gst_rate: 18 },

  // Textiles
  'cotton fabric': { hsn: '52083900', gst_rate: 5 },
  'kapda': { hsn: '52083900', gst_rate: 5 },
  'cloth': { hsn: '52083900', gst_rate: 5 },
  'textile': { hsn: '52083900', gst_rate: 5 },

  // Electronics
  'led bulbs': { hsn: '85395000', gst_rate: 18 },
  'bulb': { hsn: '85395000', gst_rate: 18 },
  'light': { hsn: '85395000', gst_rate: 18 },
  'led': { hsn: '85395000', gst_rate: 18 },

  // Default fallback
  'default': { hsn: '99999999', gst_rate: 18 }
};

/**
 * Determine tax type based on business and customer states
 * @param {string} customerState - Customer's state
 * @returns {string} 'intrastate' or 'interstate'
 */
export function determineTaxType(customerState) {
  if (!customerState || customerState.trim() === '') {
    return 'intrastate'; // Default assumption
  }

  const businessState = BUSINESS_STATE.toLowerCase().trim();
  const custState = customerState.toLowerCase().trim();

  return businessState === custState ? 'intrastate' : 'interstate';
}

/**
 * Calculate GST breakdown for an amount
 * @param {number} amount - Base amount before tax
 * @param {number} gstRate - GST rate percentage (5, 12, 18, 28)
 * @param {string} taxType - 'intrastate' or 'interstate'
 * @returns {Object} Tax breakdown
 */
export function calculateGST(amount, gstRate, taxType) {
  const gstAmount = amount * (gstRate / 100);

  if (taxType === 'intrastate') {
    // Split into CGST and SGST
    return {
      cgst: gstAmount / 2,       // Central GST
      sgst: gstAmount / 2,       // State GST
      igst: 0,
      total_tax: gstAmount,
      grand_total: amount + gstAmount
    };
  } else {
    // Use IGST for interstate
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,           // Integrated GST
      total_tax: gstAmount,
      grand_total: amount + gstAmount
    };
  }
}

/**
 * Lookup HSN code and GST rate for a product
 * @param {string} productName - Product name (can be Hindi/English)
 * @returns {Object} { hsn, gst_rate }
 */
export function lookupHSN(productName) {
  if (!productName || typeof productName !== 'string') {
    return HSN_DATABASE['default'];
  }

  const searchTerm = productName.toLowerCase().trim();

  // Direct match
  if (HSN_DATABASE[searchTerm]) {
    return HSN_DATABASE[searchTerm];
  }

  // Fuzzy match - check if any key is contained in the product name
  for (const [key, value] of Object.entries(HSN_DATABASE)) {
    if (searchTerm.includes(key) || key.includes(searchTerm)) {
      return value;
    }
  }

  // Default fallback
  console.warn(`No HSN match found for: ${productName}, using default`);
  return HSN_DATABASE['default'];
}

/**
 * Process a single line item with GST calculations
 * @param {Object} item - Item from extracted data
 * @param {string} taxType - 'intrastate' or 'interstate'
 * @returns {Object} Item with HSN, GST calculations
 */
export function processLineItem(item, taxType) {
  // Lookup HSN code and rate
  const hsnData = lookupHSN(item.name);

  // Calculate base amount
  const baseAmount = item.amount || (item.quantity * item.rate);

  // Calculate GST
  const gstBreakdown = calculateGST(baseAmount, hsnData.gst_rate, taxType);

  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    rate: item.rate,
    amount: baseAmount,
    hsn_code: hsnData.hsn,
    gst_rate: hsnData.gst_rate,
    cgst: gstBreakdown.cgst,
    sgst: gstBreakdown.sgst,
    igst: gstBreakdown.igst,
    total_tax: gstBreakdown.total_tax,
    line_total: gstBreakdown.grand_total
  };
}

/**
 * Calculate full invoice with all line items and GST totals
 * @param {Object} extractedData - Data from Gemini OCR
 * @param {string} customerState - Customer's state (optional)
 * @returns {Object} Complete invoice with GST calculations
 */
export function calculateInvoice(extractedData, customerState = null) {
  // Determine tax type
  const taxType = determineTaxType(customerState);

  // Process each line item
  const processedItems = extractedData.items.map(item =>
    processLineItem(item, taxType)
  );

  // Calculate totals
  const subtotal = processedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCGST = processedItems.reduce((sum, item) => sum + item.cgst, 0);
  const totalSGST = processedItems.reduce((sum, item) => sum + item.sgst, 0);
  const totalIGST = processedItems.reduce((sum, item) => sum + item.igst, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;
  const grandTotal = subtotal + totalTax;

  return {
    customer_name: extractedData.supplier_or_customer,
    date: extractedData.date || new Date().toLocaleDateString('en-IN'),
    items: processedItems,
    tax_type: taxType,
    subtotal: subtotal,
    cgst: totalCGST,
    sgst: totalSGST,
    igst: totalIGST,
    total_tax: totalTax,
    grand_total: grandTotal,
    business_state: BUSINESS_STATE,
    customer_state: customerState || BUSINESS_STATE
  };
}

/**
 * Format amount in words (for invoice)
 * @param {number} amount - Amount to convert
 * @returns {string} Amount in words
 */
export function amountToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (amount === 0) return 'Zero Rupees Only';

  const num = Math.floor(amount);
  let words = '';

  // Lakhs
  if (num >= 100000) {
    words += amountToWords(Math.floor(num / 100000)) + ' Lakh ';
    return words + amountToWords(num % 100000);
  }

  // Thousands
  if (num >= 1000) {
    words += amountToWords(Math.floor(num / 1000)) + ' Thousand ';
    return words + amountToWords(num % 1000);
  }

  // Hundreds
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    return words + amountToWords(num % 100);
  }

  // Tens and Ones
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    if (num % 10 > 0) {
      words += ones[num % 10] + ' ';
    }
  } else if (num >= 10) {
    words += teens[num - 10] + ' ';
  } else if (num > 0) {
    words += ones[num] + ' ';
  }

  return words.trim() + ' Rupees Only';
}

/**
 * Validate invoice data before generation
 * @param {Object} invoiceData - Calculated invoice data
 * @param {Object} options - Validation options
 * @param {boolean} options.allowZeroAmount - Allow zero amounts (for testing/receipts)
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateInvoice(invoiceData, options = {}) {
  const { allowZeroAmount = false } = options;
  const errors = [];
  const warnings = [];

  // Required fields
  if (!invoiceData.customer_name || invoiceData.customer_name.trim() === '') {
    errors.push('Customer name is required');
  }

  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.push('At least one item is required');
  }

  // Amount validation
  if (invoiceData.grand_total < 0) {
    errors.push('Invoice total cannot be negative');
  }

  if (!allowZeroAmount && invoiceData.grand_total === 0) {
    warnings.push('Invoice total is zero - no payment required');
  }

  // Item validation
  if (invoiceData.items && Array.isArray(invoiceData.items)) {
    invoiceData.items.forEach((item, index) => {
      if (!item.name || item.name.trim() === '') {
        errors.push(`Item ${index + 1}: Name is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be a positive number`);
      }
      if (typeof item.rate !== 'number' || item.rate < 0) {
        warnings.push(`Item ${index + 1}: Rate should be a non-negative number`);
      }
      if (!item.unit || item.unit.trim() === '') {
        warnings.push(`Item ${index + 1}: Unit is recommended (e.g., pcs, kg)`);
      }
    });
  }

  // GST validation
  if (invoiceData.tax_type === 'intrastate') {
    if (invoiceData.cgst < 0 || invoiceData.sgst < 0) {
      errors.push('CGST/SGST cannot be negative');
    }
    if (invoiceData.igst !== 0) {
      warnings.push('IGST should be zero for intrastate transactions');
    }
  } else if (invoiceData.tax_type === 'interstate') {
    if (invoiceData.igst < 0) {
      errors.push('IGST cannot be negative');
    }
    if (invoiceData.cgst !== 0 || invoiceData.sgst !== 0) {
      warnings.push('CGST/SGST should be zero for interstate transactions');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Export HSN database for reference
export { HSN_DATABASE };
