import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { amountToWords } from './gstEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Document type to template mapping
const TEMPLATE_MAP = {
  'sales_invoice': 'invoice.html',
  'purchase_order': 'purchase-order.html',
  'delivery_challan': 'delivery-challan.html'
};

// Root templates use simple {{PLACEHOLDER}} format compatible with our string replacement.
// Frontend templates use Handlebars syntax — only fallback if root is missing.
const TEMPLATE_PATHS = [
  join(__dirname, '../templates'),
  join(__dirname, '../frontend/templates')
];

/**
 * Generate a unique invoice number
 * @param {string} type - Document type
 * @returns {string} Invoice number
 */
function generateInvoiceNumber(type = 'INV') {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${type}-${year}${month}${day}-${random}`;
}

/**
 * Load and populate HTML template with data
 * @param {string} templateName - Template file name
 * @param {Object} data - Invoice data
 * @returns {string} Populated HTML
 */
function populateTemplate(templateName, data) {
  // Try to load from multiple template paths
  let html;
  for (const basePath of TEMPLATE_PATHS) {
    const templatePath = join(basePath, templateName);
    try {
      html = readFileSync(templatePath, 'utf-8');
      console.log(`Using template: ${templatePath}`);
      break;
    } catch (err) {
      continue;
    }
  }

  if (!html) {
    throw new Error(`Template not found: ${templateName}`);
  }

  // Business details
  html = html.replace(/{{BUSINESS_NAME}}/g, process.env.BUSINESS_NAME || 'ABC Manufacturing Pvt Ltd');
  html = html.replace(/{{BUSINESS_ADDRESS}}/g, process.env.BUSINESS_ADDRESS || 'Plot 45, MIDC, Pune 411001');
  html = html.replace(/{{BUSINESS_GSTIN}}/g, process.env.BUSINESS_GSTIN || '27AABCU9603R1ZM');

  // Invoice details
  html = html.replace(/{{INVOICE_NUMBER}}/g, data.invoice_number || generateInvoiceNumber());
  html = html.replace(/{{INVOICE_DATE}}/g, data.date || new Date().toLocaleDateString('en-IN'));
  html = html.replace(/{{CUSTOMER_NAME}}/g, data.customer_name || 'N/A');
  html = html.replace(/{{CUSTOMER_STATE}}/g, data.customer_state || data.business_state || 'Maharashtra');

  // Tax type badge
  const taxTypeBadge = data.tax_type === 'intrastate' ? 'INTRASTATE' : 'INTERSTATE';
  html = html.replace(/{{TAX_TYPE}}/g, taxTypeBadge);

  // Generate items rows
  const itemsRows = data.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td class="text-center">${item.hsn_code}</td>
      <td class="text-center">${item.quantity} ${item.unit}</td>
      <td class="text-right">₹${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td class="text-center">${item.gst_rate}%</td>
      <td class="text-right">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      <td class="text-right">₹${item.line_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  html = html.replace(/{{ITEMS_ROWS}}/g, itemsRows);

  // Generate tax rows based on type
  let taxRows = '';
  if (data.tax_type === 'intrastate') {
    taxRows = `
      <div class="total-row">
        <span>CGST:</span>
        <span>₹${data.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="total-row">
        <span>SGST:</span>
        <span>₹${data.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;
  } else {
    taxRows = `
      <div class="total-row">
        <span>IGST:</span>
        <span>₹${data.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
    `;
  }

  html = html.replace(/{{TAX_ROWS}}/g, taxRows);

  // Totals
  html = html.replace(/{{SUBTOTAL}}/g, data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
  html = html.replace(/{{GRAND_TOTAL}}/g, data.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 }));

  // Amount in words
  const amountInWords = amountToWords(data.grand_total);
  html = html.replace(/{{AMOUNT_IN_WORDS}}/g, amountInWords);

  return html;
}

/**
 * Generate PDF from invoice data
 * @param {Object} invoiceData - Calculated invoice data from gstEngine
 * @param {string} documentType - 'sales_invoice', 'purchase_order', 'delivery_challan'
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePDF(invoiceData, documentType = 'sales_invoice') {
  let browser;

  try {
    console.log('Launching Puppeteer...');

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Get template
    const templateName = TEMPLATE_MAP[documentType] || TEMPLATE_MAP['sales_invoice'];

    // Add invoice number if not present
    if (!invoiceData.invoice_number) {
      const prefix = documentType === 'purchase_order' ? 'PO' :
                     documentType === 'delivery_challan' ? 'DC' : 'INV';
      invoiceData.invoice_number = generateInvoiceNumber(prefix);
    }

    // Populate template
    const html = populateTemplate(templateName, invoiceData);

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    console.log(`PDF generated successfully: ${pdfBuffer.length} bytes`);

    return pdfBuffer;

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate HTML preview (for debugging)
 * @param {Object} invoiceData - Invoice data
 * @param {string} documentType - Document type
 * @returns {string} HTML string
 */
export function generateHTMLPreview(invoiceData, documentType = 'sales_invoice') {
  const templateName = TEMPLATE_MAP[documentType] || TEMPLATE_MAP['sales_invoice'];

  if (!invoiceData.invoice_number) {
    const prefix = documentType === 'purchase_order' ? 'PO' :
                   documentType === 'delivery_challan' ? 'DC' : 'INV';
    invoiceData.invoice_number = generateInvoiceNumber(prefix);
  }

  return populateTemplate(templateName, invoiceData);
}

export { generateInvoiceNumber };
