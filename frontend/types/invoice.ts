/**
 * SnapBooks - Invoice Type Definitions
 * TypeScript interfaces for Indian GST-compliant invoices
 */

export interface Company {
  name: string;
  address: string;
  city: string;
  udyamRegistration?: string; // Udyam Registration Number (for MSMEs)
  gstin: string; // GST Identification Number
  stateName: string;
  stateCode: string;
  cin?: string; // Corporate Identification Number
  contact: string[]; // Array of phone numbers
  email: string;
  pan: string; // Permanent Account Number
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  gstin: string;
  stateName: string;
  stateCode: string;
}

export interface Product {
  id: string;
  name: string;
  nameHindi?: string; // Optional Hindi name
  hsnCode: string; // HSN/SAC code for GST
  gstRate: number; // GST rate (5, 12, 18, 28)
  unit: string; // KG, TON, PCS, MTR, etc.
}

export interface InvoiceItem {
  slNo: number;
  productId: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number; // Rate per unit
  amount: number; // quantity * rate
}

export interface GSTSummaryRow {
  hsnCode: string;
  taxableValue: number;
  cgstRate?: number; // For intrastate
  cgstAmount?: number;
  sgstRate?: number; // For intrastate
  sgstAmount?: number;
  igstRate?: number; // For interstate
  igstAmount?: number;
  totalTaxAmount: number;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  branchAndIFSC: string;
}

export interface Invoice {
  // E-Invoice Details
  irn?: string; // Invoice Reference Number (for e-invoices)
  ackNo?: string; // Acknowledgement Number
  ackDate?: string; // Acknowledgement Date
  qrCode?: string; // QR code data for e-invoice

  // Invoice Header
  invoiceNo: string;
  dated: string; // Invoice date
  referenceNo?: string;
  referenceDate?: string;

  // Company & Customer
  company: Company;
  consignee: Customer; // Ship to
  billTo: Customer; // Bill to (can be same as consignee)
  placeOfSupply: string; // State name for GST calculation

  // Transaction Details
  deliveryNote?: string;
  buyersOrderNo?: string;
  dispatchDocNo?: string;
  dispatchedThrough?: string;
  billOfLading?: string;
  motorVehicleNo?: string;
  modeOfPayment: string; // e.g., "90 Days", "Cash", "Credit"
  termsOfDelivery?: string;
  otherReferences?: string;
  destination?: string;
  deliveryNoteDate?: string;

  // Invoice Items
  items: InvoiceItem[];

  // Calculations
  subtotal: number; // Sum of all items
  gstSummary: GSTSummaryRow[];
  totalTaxAmount: number;
  grandTotal: number; // subtotal + totalTaxAmount

  // Text Representations
  amountInWords: string; // Grand total in words
  taxAmountInWords: string; // Tax amount in words

  // Footer
  bankDetails: BankDetails;
  declaration: string;
  authorizedSignatory: string;
  jurisdiction?: string; // e.g., "SUBJECT TO UDAIPUR JURISDICTION"

  // Document Type
  documentType: 'TAX_INVOICE' | 'PURCHASE_ORDER' | 'DELIVERY_CHALLAN';
}

// Utility type for GST calculation
export type GSTType = 'INTRASTATE' | 'INTERSTATE';

// Helper function to determine GST type
export function getGSTType(
  companyStateCode: string,
  customerStateCode: string
): GSTType {
  return companyStateCode === customerStateCode ? 'INTRASTATE' : 'INTERSTATE';
}

// Helper function to calculate GST breakdown
export function calculateGST(
  amount: number,
  gstRate: number,
  gstType: GSTType
): {
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
} {
  const totalGST = (amount * gstRate) / 100;

  if (gstType === 'INTRASTATE') {
    const halfGST = totalGST / 2;
    return {
      cgst: halfGST,
      sgst: halfGST,
      total: totalGST
    };
  } else {
    return {
      igst: totalGST,
      total: totalGST
    };
  }
}

// Number to words converter for Indian numbering system
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertHundreds(n: number): string {
    let str = '';
    if (n > 99) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n > 9) {
      str += teens[n - 10] + ' ';
      return str;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  }

  // Handle integer and decimal parts
  const [intPart, decPart] = num.toFixed(2).split('.');
  const intNum = parseInt(intPart);

  let words = '';

  // Indian numbering system: crores, lakhs, thousands, hundreds
  if (intNum >= 10000000) {
    words += convertHundreds(Math.floor(intNum / 10000000)) + 'Crore ';
  }
  if (intNum >= 100000) {
    words += convertHundreds(Math.floor((intNum % 10000000) / 100000)) + 'Lakh ';
  }
  if (intNum >= 1000) {
    words += convertHundreds(Math.floor((intNum % 100000) / 1000)) + 'Thousand ';
  }
  words += convertHundreds(intNum % 1000);

  // Add decimal part if exists and not zero
  if (decPart && parseInt(decPart) > 0) {
    words += 'and ' + convertHundreds(parseInt(decPart)) + 'Paise';
  }

  return words.trim() + ' Only';
}
