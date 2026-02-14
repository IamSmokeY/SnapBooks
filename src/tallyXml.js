import { create } from 'xmlbuilder2';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate Tally XML for invoice import
 * @param {Object} invoiceData - Calculated invoice data from gstEngine
 * @param {string} voucherType - 'Sales' or 'Purchase'
 * @returns {string} Tally XML string
 */
export function generateTallyXML(invoiceData, voucherType = 'Sales') {
  const date = parseDateForTally(invoiceData.date);
  const voucherNumber = invoiceData.invoice_number || 'INV-001';

  // Create XML root
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ENVELOPE');

  // Header
  doc.ele('HEADER')
    .ele('TALLYREQUEST').txt('Import Data').up()
    .up();

  // Body
  const body = doc.ele('BODY');
  const importData = body.ele('IMPORTDATA');

  // Request descriptor
  importData.ele('REQUESTDESC')
    .ele('REPORTNAME').txt('Vouchers').up()
    .ele('STATICVARIABLES')
      .ele('SVCURRENTCOMPANY').txt(process.env.BUSINESS_NAME || 'ABC Manufacturing Pvt Ltd').up()
    .up()
  .up();

  // Request data
  const requestData = importData.ele('REQUESTDATA');
  const tallyMessage = requestData.ele('TALLYMESSAGE', { 'xmlns:UDF': 'TallyUDF' });

  // Voucher
  const voucher = tallyMessage.ele('VOUCHER', {
    'VCHTYPE': voucherType,
    'ACTION': 'Create',
    'OBJVIEW': 'Invoice Voucher View'
  });

  // Basic voucher details
  voucher.ele('DATE').txt(date);
  voucher.ele('VOUCHERTYPENAME').txt(voucherType);
  voucher.ele('VOUCHERNUMBER').txt(voucherNumber);
  voucher.ele('PARTYLEDGERNAME').txt(invoiceData.customer_name);

  // Reference details
  voucher.ele('REFERENCE').txt(voucherNumber);
  voucher.ele('NARRATION').txt(`${voucherType} Invoice - ${invoiceData.customer_name}`);

  // Determine if it's a debit or credit voucher
  const isDeemed = voucherType === 'Sales' ? 'Yes' : 'No';
  const partyAmount = voucherType === 'Sales' ? -invoiceData.grand_total : invoiceData.grand_total;
  const salesAmount = voucherType === 'Sales' ? invoiceData.subtotal : -invoiceData.subtotal;

  // Party ledger entry (Customer/Supplier)
  const partyLedger = voucher.ele('ALLLEDGERENTRIES.LIST');
  partyLedger.ele('LEDGERNAME').txt(invoiceData.customer_name);
  partyLedger.ele('ISDEEMEDPOSITIVE').txt(isDeemed);
  partyLedger.ele('AMOUNT').txt(partyAmount.toFixed(2));

  // GST details for party ledger
  if (invoiceData.tax_type === 'intrastate') {
    partyLedger.ele('CATEGORYALLOCATIONS.LIST')
      .ele('CATEGORY').txt('Primary Cost Category').up()
      .ele('COSTCENTREALLOCATIONS.LIST')
        .ele('NAME').txt('Main Cost Centre').up()
      .up()
    .up();
  }
  partyLedger.up();

  // Sales/Purchase ledger entry
  const salesLedger = voucher.ele('ALLLEDGERENTRIES.LIST');
  salesLedger.ele('LEDGERNAME').txt(voucherType === 'Sales' ? 'Sales Account' : 'Purchase Account');
  salesLedger.ele('ISDEEMEDPOSITIVE').txt(voucherType === 'Sales' ? 'No' : 'Yes');
  salesLedger.ele('AMOUNT').txt(salesAmount.toFixed(2));
  salesLedger.up();

  // GST ledger entries
  if (invoiceData.tax_type === 'intrastate') {
    // CGST
    if (invoiceData.cgst > 0) {
      const cgstLedger = voucher.ele('ALLLEDGERENTRIES.LIST');
      cgstLedger.ele('LEDGERNAME').txt(`CGST ${getGSTRate(invoiceData)}%`);
      cgstLedger.ele('ISDEEMEDPOSITIVE').txt(voucherType === 'Sales' ? 'No' : 'Yes');
      cgstLedger.ele('AMOUNT').txt((voucherType === 'Sales' ? invoiceData.cgst : -invoiceData.cgst).toFixed(2));
      cgstLedger.up();
    }

    // SGST
    if (invoiceData.sgst > 0) {
      const sgstLedger = voucher.ele('ALLLEDGERENTRIES.LIST');
      sgstLedger.ele('LEDGERNAME').txt(`SGST ${getGSTRate(invoiceData)}%`);
      sgstLedger.ele('ISDEEMEDPOSITIVE').txt(voucherType === 'Sales' ? 'No' : 'Yes');
      sgstLedger.ele('AMOUNT').txt((voucherType === 'Sales' ? invoiceData.sgst : -invoiceData.sgst).toFixed(2));
      sgstLedger.up();
    }
  } else {
    // IGST
    if (invoiceData.igst > 0) {
      const igstLedger = voucher.ele('ALLLEDGERENTRIES.LIST');
      igstLedger.ele('LEDGERNAME').txt(`IGST ${getGSTRate(invoiceData)}%`);
      igstLedger.ele('ISDEEMEDPOSITIVE').txt(voucherType === 'Sales' ? 'No' : 'Yes');
      igstLedger.ele('AMOUNT').txt((voucherType === 'Sales' ? invoiceData.igst : -invoiceData.igst).toFixed(2));
      igstLedger.up();
    }
  }

  // Inventory entries for each item
  invoiceData.items.forEach((item) => {
    const inventoryEntry = voucher.ele('INVENTORYENTRIES.LIST');

    inventoryEntry.ele('STOCKITEMNAME').txt(item.name);
    inventoryEntry.ele('ISDEEMEDPOSITIVE').txt(voucherType === 'Sales' ? 'No' : 'Yes');
    inventoryEntry.ele('RATE').txt(`${item.rate.toFixed(2)}/${item.unit}`);
    inventoryEntry.ele('AMOUNT').txt((voucherType === 'Sales' ? item.amount : -item.amount).toFixed(2));
    inventoryEntry.ele('ACTUALQTY').txt(`${item.quantity} ${item.unit}`);
    inventoryEntry.ele('BILLEDQTY').txt(`${item.quantity} ${item.unit}`);

    // Batch/Godown allocations (optional - can be extended)
    const batchAllocations = inventoryEntry.ele('BATCHALLOCATIONS.LIST');
    batchAllocations.ele('GODOWNNAME').txt('Main Godown').up();
    batchAllocations.ele('BATCHNAME').txt('Primary Batch').up();
    batchAllocations.ele('AMOUNT').txt((voucherType === 'Sales' ? item.amount : -item.amount).toFixed(2)).up();
    batchAllocations.ele('ACTUALQTY').txt(`${item.quantity} ${item.unit}`).up();
    batchAllocations.up();

    // GST details for inventory item
    const accountingAllocations = inventoryEntry.ele('ACCOUNTINGALLOCATIONS.LIST');
    accountingAllocations.ele('LEDGERNAME').txt(voucherType === 'Sales' ? 'Sales Account' : 'Purchase Account').up();
    accountingAllocations.ele('ISDEEMEDPOSITIVE').txt(voucherType === 'Sales' ? 'No' : 'Yes').up();
    accountingAllocations.ele('AMOUNT').txt((voucherType === 'Sales' ? item.amount : -item.amount).toFixed(2)).up();
    accountingAllocations.up();

    inventoryEntry.up();
  });

  // Generate XML string
  const xml = doc.end({ prettyPrint: true, indent: '  ' });
  return xml;
}

/**
 * Parse date from various formats to Tally format (YYYYMMDD)
 * @param {string} dateStr - Date string (DD/MM/YYYY or ISO format)
 * @returns {string} Date in Tally format
 */
function parseDateForTally(dateStr) {
  if (!dateStr) {
    const today = new Date();
    return today.getFullYear().toString() +
           (today.getMonth() + 1).toString().padStart(2, '0') +
           today.getDate().toString().padStart(2, '0');
  }

  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}${month}${day}`;
    }
  }

  // Handle ISO format
  const date = new Date(dateStr);
  if (!isNaN(date)) {
    return date.getFullYear().toString() +
           (date.getMonth() + 1).toString().padStart(2, '0') +
           date.getDate().toString().padStart(2, '0');
  }

  // Fallback to today
  const today = new Date();
  return today.getFullYear().toString() +
         (today.getMonth() + 1).toString().padStart(2, '0') +
         today.getDate().toString().padStart(2, '0');
}

/**
 * Get GST rate from invoice items (takes from first item)
 * @param {Object} invoiceData - Invoice data
 * @returns {number} GST rate percentage
 */
function getGSTRate(invoiceData) {
  if (invoiceData.items && invoiceData.items.length > 0) {
    return invoiceData.items[0].gst_rate || 18;
  }
  return 18; // Default
}

/**
 * Validate Tally XML structure
 * @param {string} xml - XML string
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateTallyXML(xml) {
  const errors = [];

  if (!xml || typeof xml !== 'string') {
    errors.push('XML is empty or invalid');
    return { valid: false, errors };
  }

  // Check for required root elements
  if (!xml.includes('<ENVELOPE>')) {
    errors.push('Missing ENVELOPE root element');
  }

  if (!xml.includes('<HEADER>')) {
    errors.push('Missing HEADER element');
  }

  if (!xml.includes('<BODY>')) {
    errors.push('Missing BODY element');
  }

  if (!xml.includes('<VOUCHER')) {
    errors.push('Missing VOUCHER element');
  }

  // Check for required voucher fields
  const requiredFields = [
    'DATE',
    'VOUCHERTYPENAME',
    'VOUCHERNUMBER',
    'PARTYLEDGERNAME',
    'ALLLEDGERENTRIES.LIST'
  ];

  requiredFields.forEach(field => {
    if (!xml.includes(`<${field}>`)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate Tally XML for Purchase Order
 * @param {Object} invoiceData - Invoice data
 * @returns {string} Tally XML
 */
export function generatePurchaseOrderXML(invoiceData) {
  return generateTallyXML(invoiceData, 'Purchase');
}

/**
 * Generate Tally XML for Sales Invoice
 * @param {Object} invoiceData - Invoice data
 * @returns {string} Tally XML
 */
export function generateSalesInvoiceXML(invoiceData) {
  return generateTallyXML(invoiceData, 'Sales');
}
