import re
from datetime import datetime

from fpdf import FPDF
from pydantic import BaseModel, Field

from src.config import ROOT_DIR
from src.models import InvoiceData, ToolResponse
from src.firebase import save_invoice, upload_file
from src.logger import log

INVOICES_DIR = ROOT_DIR / "invoices"
INVOICES_DIR.mkdir(exist_ok=True)


class GenerateInvoiceRequest(BaseModel):
    invoice_data: InvoiceData = Field(..., description="Extracted invoice data")
    user_id: str | None = Field(None, description="Telegram user ID for tracking")
    save_to_firebase: bool = Field(False, description="Whether to upload to Firebase Storage and Firestore")


# ── Number to Indian English words ──────────────────────────────────────────


def _num_to_words_indian(n: int) -> str:
    if n == 0:
        return "Zero"

    ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen",
    ]
    tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    ]

    def two_digits(num: int) -> str:
        if num < 20:
            return ones[num]
        return tens[num // 10] + (" " + ones[num % 10] if num % 10 else "")

    def three_digits(num: int) -> str:
        if num >= 100:
            return ones[num // 100] + " Hundred" + (" and " + two_digits(num % 100) if num % 100 else "")
        return two_digits(num)

    parts = []
    if n >= 1_00_00_000:
        parts.append(two_digits(n // 1_00_00_000) + " Crore")
        n %= 1_00_00_000
    if n >= 1_00_000:
        parts.append(two_digits(n // 1_00_000) + " Lakh")
        n %= 1_00_000
    if n >= 1_000:
        parts.append(two_digits(n // 1_000) + " Thousand")
        n %= 1_000
    if n > 0:
        parts.append(three_digits(n))

    return " ".join(parts)


# ── PDF Helper ──────────────────────────────────────────────────────────────


class InvoicePDF(FPDF):
    """Custom PDF with helper methods for the invoice layout."""

    LEFT_MARGIN = 10
    PAGE_WIDTH = 190  # A4 usable width with 10mm margins

    def bordered_cell(self, w, h, txt="", border=1, align="L", font_style="", font_size=8, fill=False):
        if font_style or font_size:
            self.set_font("Helvetica", font_style, font_size)
        self.cell(w, h, txt, border=border, align=align, fill=fill)

    def meta_row(self, x_left, w_left, x_right, w_right, label, value, h=5):
        self.set_xy(x_left, self.get_y())
        self.bordered_cell(w_left, h, f" {label}", font_style="", font_size=7)
        self.bordered_cell(w_right, h, f" {value or ''}", font_style="", font_size=7)


# ── Main generator ──────────────────────────────────────────────────────────


async def generate_invoice_pdf(request: GenerateInvoiceRequest) -> ToolResponse:
    """Generate a professional GST-compliant invoice PDF matching the standard Indian tax invoice format."""
    data = request.invoice_data
    seller = data.seller
    buyer = data.buyer
    consignee = data.consignee or buyer

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    invoice_number = data.invoice_number or f"SB-{timestamp}"

    # Default declaration and jurisdiction if not provided
    if not data.declaration:
        data.declaration = (
            "We declare that this invoice shows the actual price of the "
            "goods described and that all particulars are true and correct."
        )
    if not data.jurisdiction and seller.state_name:
        data.jurisdiction = f"{seller.state_name} Jurisdiction"

    pdf = InvoicePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Helvetica", "", 8)

    W = pdf.PAGE_WIDTH  # 190mm total
    LEFT_COL = 95  # left column width
    RIGHT_COL = 95  # right column width
    ROW_H = 5  # standard row height

    x_start = pdf.LEFT_MARGIN
    y_start = pdf.get_y()

    # ── SELLER DETAILS (top-left) + INVOICE METADATA (top-right) ────────

    # Seller block
    seller_lines = [seller.name]
    if seller.address:
        seller_lines.append(seller.address)
    if seller.udyam_registration:
        seller_lines.append(f"Udyam Registration {seller.udyam_registration}")
    if seller.gstin:
        seller_lines.append(f"GSTIN/UIN: {seller.gstin}")
    if seller.state_name:
        state_text = f"State Name : {seller.state_name}"
        if seller.state_code:
            state_text += f", Code : {seller.state_code}"
        seller_lines.append(state_text)
    if seller.cin:
        seller_lines.append(f"CIN: {seller.cin}")
    if seller.contact:
        seller_lines.append(f"Contact : {seller.contact}")
    if seller.email:
        seller_lines.append(f"E-Mail : {seller.email}")

    # Calculate seller block height
    seller_h = max(len(seller_lines) * ROW_H, 40)

    # Draw seller box
    pdf.set_xy(x_start, y_start)
    pdf.rect(x_start, y_start, LEFT_COL, seller_h)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_xy(x_start + 1, y_start + 1)
    pdf.cell(LEFT_COL - 2, ROW_H, seller.name)
    pdf.set_font("Helvetica", "", 7)
    for i, line in enumerate(seller_lines[1:], 1):
        pdf.set_xy(x_start + 1, y_start + 1 + i * (ROW_H - 1))
        pdf.cell(LEFT_COL - 2, ROW_H - 1, line)

    # Invoice metadata grid (right column)
    meta_x = x_start + LEFT_COL
    meta_label_w = 47
    meta_value_w = 48

    meta_rows = [
        ("Invoice No.", invoice_number),
        ("Dated", data.date),
        ("Delivery Note", data.delivery_note),
        ("Mode/Terms of Payment", data.payment_terms),
        ("Reference No. & Date.", data.reference_no),
        ("Buyer's Order No.", data.buyers_order_no),
        ("Dispatch Doc No.", data.dispatch_doc_no),
        ("Delivery Note Date", data.delivery_note_date),
        ("Dispatched through", data.dispatched_through),
        ("Destination", data.destination),
        ("Bill of Lading/LR-RR No.", data.bill_of_lading_no),
        ("Motor Vehicle No.", data.motor_vehicle_no),
        ("Terms of Delivery", data.terms_of_delivery),
    ]

    meta_y = y_start
    for label, value in meta_rows:
        pdf.set_xy(meta_x, meta_y)
        pdf.set_font("Helvetica", "", 7)
        pdf.cell(meta_label_w, ROW_H, f" {label}", border=1)
        pdf.set_font("Helvetica", "B" if value else "", 7)
        pdf.cell(meta_value_w, ROW_H, f" {value or ''}", border=1)
        meta_y += ROW_H

    # Ensure seller box extends to match metadata height
    meta_total_h = len(meta_rows) * ROW_H
    if meta_total_h > seller_h:
        pdf.rect(x_start, y_start, LEFT_COL, meta_total_h)

    current_y = y_start + max(seller_h, meta_total_h)

    # ── CONSIGNEE (Ship to) ─────────────────────────────────────────────

    consignee_y = current_y
    pdf.set_xy(x_start, consignee_y)
    pdf.set_font("Helvetica", "", 7)
    pdf.cell(LEFT_COL, ROW_H, " Consignee (Ship to)", border=1)
    consignee_y += ROW_H

    consignee_lines = [consignee.name]
    if consignee.address:
        consignee_lines.append(consignee.address)
    if consignee.gstin:
        consignee_lines.append(f"GSTIN/UIN      : {consignee.gstin}")
    if consignee.state_name:
        state_text = f"State Name     : {consignee.state_name}"
        if consignee.state_code:
            state_text += f", Code : {consignee.state_code}"
        consignee_lines.append(state_text)

    consignee_block_h = len(consignee_lines) * ROW_H
    pdf.rect(x_start, consignee_y, LEFT_COL, consignee_block_h)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_xy(x_start + 1, consignee_y + 1)
    pdf.cell(LEFT_COL - 2, ROW_H - 1, consignee.name)
    pdf.set_font("Helvetica", "", 7)
    for i, line in enumerate(consignee_lines[1:], 1):
        pdf.set_xy(x_start + 1, consignee_y + 1 + i * (ROW_H - 1))
        pdf.cell(LEFT_COL - 2, ROW_H - 1, line)

    current_y = consignee_y + consignee_block_h

    # ── BUYER (Bill to) ─────────────────────────────────────────────────

    buyer_y = current_y
    pdf.set_xy(x_start, buyer_y)
    pdf.set_font("Helvetica", "", 7)
    pdf.cell(LEFT_COL, ROW_H, " Buyer (Bill to)", border=1)
    buyer_y += ROW_H

    buyer_lines = [buyer.name]
    if buyer.address:
        buyer_lines.append(buyer.address)
    if buyer.gstin:
        buyer_lines.append(f"GSTIN/UIN      : {buyer.gstin}")
    if buyer.state_name:
        state_text = f"State Name     : {buyer.state_name}"
        if buyer.state_code:
            state_text += f", Code : {buyer.state_code}"
        buyer_lines.append(state_text)
    if buyer.place_of_supply:
        buyer_lines.append(f"Place of Supply : {buyer.place_of_supply}")

    buyer_block_h = len(buyer_lines) * ROW_H
    pdf.rect(x_start, buyer_y, LEFT_COL, buyer_block_h)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_xy(x_start + 1, buyer_y + 1)
    pdf.cell(LEFT_COL - 2, ROW_H - 1, buyer.name)
    pdf.set_font("Helvetica", "", 7)
    for i, line in enumerate(buyer_lines[1:], 1):
        pdf.set_xy(x_start + 1, buyer_y + 1 + i * (ROW_H - 1))
        pdf.cell(LEFT_COL - 2, ROW_H - 1, line)

    current_y = buyer_y + buyer_block_h

    # ── ITEMS TABLE ─────────────────────────────────────────────────────

    items_y = current_y
    col_widths = [10, 70, 25, 25, 20, 20, 20]  # SI, Description, HSN, Qty, Rate, Per, Amount
    headers = ["Sl\nNo.", "Description of Goods", "HSN/SAC", "Quantity", "Rate", "per", "Amount"]

    # Header row
    pdf.set_xy(x_start, items_y)
    pdf.set_font("Helvetica", "B", 7)
    for i, (header, w) in enumerate(zip(headers, col_widths)):
        align = "C"
        pdf.cell(w, 8, header, border=1, align=align)
    items_y += 8

    # Item rows
    pdf.set_font("Helvetica", "", 8)
    for idx, item in enumerate(data.items, 1):
        pdf.set_xy(x_start, items_y)
        pdf.cell(col_widths[0], 6, str(idx), border=1, align="C")
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(col_widths[1], 6, item.name[:40], border=1)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(col_widths[2], 6, item.hsn_code or "", border=1, align="C")
        pdf.cell(col_widths[3], 6, f"{item.quantity:,.3f} {item.unit}", border=1, align="R")
        pdf.cell(col_widths[4], 6, f"{item.rate:,.2f}", border=1, align="R")
        pdf.cell(col_widths[5], 6, item.unit, border=1, align="C")
        pdf.cell(col_widths[6], 6, f"{item.amount:,.2f}", border=1, align="R")
        items_y += 6

    # Subtotal row
    pdf.set_xy(x_start, items_y)
    subtotal_label_w = sum(col_widths[:6])
    pdf.cell(subtotal_label_w, 6, "", border="LR")
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(col_widths[6], 6, f"{data.subtotal:,.2f}", border=1, align="R")
    items_y += 6

    # Tax row(s)
    if data.tax_type == "igst" and data.igst_amount is not None:
        pdf.set_xy(x_start, items_y)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(subtotal_label_w, 6, "  IGST", border="LR", align="R")
        pdf.cell(col_widths[6], 6, f"{data.igst_amount:,.2f}", border=1, align="R")
        items_y += 6
    else:
        if data.cgst_amount is not None:
            pdf.set_xy(x_start, items_y)
            pdf.set_font("Helvetica", "B", 8)
            pdf.cell(subtotal_label_w, 6, "  CGST", border="LR", align="R")
            pdf.cell(col_widths[6], 6, f"{data.cgst_amount:,.2f}", border=1, align="R")
            items_y += 6
        if data.sgst_amount is not None:
            pdf.set_xy(x_start, items_y)
            pdf.cell(subtotal_label_w, 6, "  SGST", border="LR", align="R")
            pdf.cell(col_widths[6], 6, f"{data.sgst_amount:,.2f}", border=1, align="R")
            items_y += 6

    # Grand total row
    pdf.set_xy(x_start, items_y)
    pdf.set_font("Helvetica", "B", 9)
    total_qty = sum(item.quantity for item in data.items)
    total_unit = data.items[0].unit if data.items else ""
    pdf.cell(col_widths[0] + col_widths[1], 7, "  Total", border=1, align="R")
    pdf.cell(col_widths[2], 7, "", border=1)
    pdf.cell(col_widths[3], 7, f"{total_qty:,.3f} {total_unit}", border=1, align="R")
    pdf.cell(col_widths[4] + col_widths[5], 7, "", border=1)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(col_widths[6], 7, f"{data.total_amount:,.2f}", border=1, align="R")
    items_y += 7

    # ── AMOUNT IN WORDS ─────────────────────────────────────────────────

    total_words = _num_to_words_indian(int(round(data.total_amount)))
    pdf.set_xy(x_start, items_y)
    pdf.set_font("Helvetica", "", 7)
    pdf.cell(W * 0.35, 5, " Amount Chargeable (in words)", border="LB")
    pdf.set_font("Helvetica", "", 7)
    pdf.cell(W * 0.65, 5, "E. & O.E", border="RB", align="R")
    items_y += 5
    pdf.set_xy(x_start, items_y)
    pdf.set_font("Helvetica", "B", 8)
    pdf.cell(W, 6, f" INR {total_words} Only", border="LRB")
    items_y += 6

    # ── HSN SUMMARY TABLE ───────────────────────────────────────────────

    if data.hsn_summary:
        hsn_y = items_y
        tax_label = "IGST" if data.tax_type == "igst" else "CGST/SGST"
        hsn_cols = [50, 40, 20, 30, 30]  # HSN, Taxable Value, Rate, Tax Amount, Total

        pdf.set_xy(x_start, hsn_y)
        pdf.set_font("Helvetica", "B", 7)
        pdf.cell(hsn_cols[0], 8, " HSN/SAC", border=1, align="C")
        pdf.cell(hsn_cols[1], 8, "Taxable\nValue", border=1, align="C")
        pdf.cell(hsn_cols[2], 4, tax_label, border="LRT", align="C")
        pdf.set_xy(x_start + sum(hsn_cols[:2]), hsn_y + 4)
        pdf.cell(hsn_cols[2] // 2, 4, "Rate", border="LB", align="C")
        pdf.cell(hsn_cols[2] // 2 + hsn_cols[2] % 2, 4, "Amount", border="RB", align="C")
        pdf.set_xy(x_start + sum(hsn_cols[:3]), hsn_y)
        pdf.cell(hsn_cols[3], 8, f"{tax_label}\nAmount", border=1, align="C")
        pdf.cell(hsn_cols[4], 8, "Total\nTax Amount", border=1, align="C")
        hsn_y += 8

        pdf.set_font("Helvetica", "", 7)
        total_taxable = 0
        total_tax = 0
        for hsn_item in data.hsn_summary:
            pdf.set_xy(x_start, hsn_y)
            pdf.cell(hsn_cols[0], 5, f" {hsn_item.hsn_code}", border=1)
            pdf.cell(hsn_cols[1], 5, f"{hsn_item.taxable_value:,.2f}", border=1, align="R")
            pdf.cell(hsn_cols[2], 5, f"{hsn_item.tax_rate:g}%", border=1, align="C")
            pdf.cell(hsn_cols[3], 5, f"{hsn_item.tax_amount:,.2f}", border=1, align="R")
            pdf.cell(hsn_cols[4], 5, f"{hsn_item.tax_amount:,.2f}", border=1, align="R")
            total_taxable += hsn_item.taxable_value
            total_tax += hsn_item.tax_amount
            hsn_y += 5

        # HSN total row
        pdf.set_xy(x_start, hsn_y)
        pdf.set_font("Helvetica", "B", 7)
        pdf.cell(hsn_cols[0], 5, "  Total", border=1, align="R")
        pdf.cell(hsn_cols[1], 5, f"{total_taxable:,.2f}", border=1, align="R")
        pdf.cell(hsn_cols[2], 5, "", border=1)
        pdf.cell(hsn_cols[3], 5, f"{total_tax:,.2f}", border=1, align="R")
        pdf.cell(hsn_cols[4], 5, f"{total_tax:,.2f}", border=1, align="R")
        hsn_y += 5

        # Tax amount in words
        tax_words = _num_to_words_indian(int(round(data.total_tax_amount)))
        pdf.set_xy(x_start, hsn_y)
        pdf.set_font("Helvetica", "", 7)
        pdf.cell(25, 5, " Tax Amount(in words) :", border=0)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(W - 25, 5, f"INR {tax_words} Only")
        hsn_y += 6

        items_y = hsn_y

    # ── BOTTOM SECTION: Declaration + Bank Details ──────────────────────

    bottom_y = items_y
    bottom_left_w = W * 0.5
    bottom_right_w = W * 0.5

    # Left: PAN + Declaration
    pdf.set_xy(x_start, bottom_y)
    pdf.set_font("Helvetica", "", 7)
    if seller.pan:
        pdf.cell(bottom_left_w, 5, f" Company's PAN    : {seller.pan}", border="LT")
        bottom_left_y = bottom_y + 5
    else:
        bottom_left_y = bottom_y

    if data.declaration:
        pdf.set_xy(x_start, bottom_left_y)
        pdf.set_font("Helvetica", "B", 7)
        pdf.cell(bottom_left_w, 4, " Declaration", border="L")
        pdf.set_xy(x_start, bottom_left_y + 4)
        pdf.set_font("Helvetica", "", 6)
        pdf.multi_cell(bottom_left_w, 3, f" {data.declaration}", border=0)
        bottom_left_y = pdf.get_y()

    # Right: Bank details
    if data.bank_details:
        bank = data.bank_details
        pdf.set_xy(x_start + bottom_left_w, bottom_y)
        pdf.set_font("Helvetica", "B", 7)
        pdf.cell(bottom_right_w, 5, " Company's Bank Details", border="LTR")
        bank_y = bottom_y + 5

        bank_rows = [
            ("A/c Holder's Name", bank.account_holder),
            ("Bank Name", bank.bank_name),
            ("A/c No.", bank.account_no),
            ("Branch & IFS Code", bank.branch_ifsc),
        ]
        for label, value in bank_rows:
            pdf.set_xy(x_start + bottom_left_w, bank_y)
            pdf.set_font("Helvetica", "", 7)
            pdf.cell(35, 4, f" {label}", border=0)
            pdf.set_font("Helvetica", "B", 7)
            pdf.cell(bottom_right_w - 37, 4, f": {value}", border=0)
            bank_y += 4

        # "for COMPANY NAME" + Authorised Signatory
        pdf.set_xy(x_start + bottom_left_w, bank_y)
        pdf.set_font("Helvetica", "B", 7)
        pdf.cell(bottom_right_w, 5, f" for {seller.name}", border="LR", align="C")
        bank_y += 5
        pdf.set_xy(x_start + bottom_left_w, bank_y)
        pdf.cell(bottom_right_w, 10, "", border="LR")
        bank_y += 10
        pdf.set_xy(x_start + bottom_left_w, bank_y)
        pdf.set_font("Helvetica", "", 7)
        pdf.cell(bottom_right_w, 5, "Authorised Signatory ", border="LRB", align="R")
        bank_y += 5

        # Draw left border to match height
        final_bottom = max(bottom_left_y, bank_y)
        pdf.rect(x_start, bottom_y, W, final_bottom - bottom_y)
        items_y = final_bottom
    else:
        items_y = max(bottom_left_y, items_y)

    # ── FOOTER ──────────────────────────────────────────────────────────

    if data.jurisdiction:
        pdf.set_xy(x_start, items_y)
        pdf.set_font("Helvetica", "", 7)
        pdf.cell(W, 5, f"SUBJECT TO {data.jurisdiction.upper()}", align="C")
        items_y += 5

    pdf.set_xy(x_start, items_y)
    pdf.set_font("Helvetica", "", 7)
    pdf.cell(W, 5, "This is a Computer Generated Invoice", align="C")

    # ── SAVE ────────────────────────────────────────────────────────────

    # Build descriptive filename: SB-{date}_{invoice}_{buyer}.pdf
    date_part = (data.date or datetime.now().strftime("%d-%b-%Y")).replace("/", "-").replace(" ", "")
    inv_part = invoice_number.replace("/", "-").replace(" ", "")
    buyer_short = re.sub(r"[^a-zA-Z0-9]", "-", buyer.name)[:30].strip("-")
    filename = f"SB_{date_part}_{inv_part}_{buyer_short}.pdf"
    filepath = INVOICES_DIR / filename
    pdf.output(str(filepath))

    pdf_url = None
    firestore_saved = False

    # Upload to Firebase if enabled
    if request.save_to_firebase:
        try:
            # Read PDF bytes for upload
            with open(filepath, 'rb') as f:
                pdf_bytes = f.read()

            # Upload to Firebase Storage
            storage_path = f"invoices/pdfs/{inv_part}.pdf"
            pdf_url = await upload_file(pdf_bytes, storage_path, 'application/pdf')

            # Save metadata to Firestore
            invoice_metadata = {
                "invoice_number": invoice_number,
                "customer_name": buyer.name,
                "date": data.date,
                "document_type": data.document_type,
                "subtotal": data.subtotal,
                "tax_type": data.tax_type,
                "total_tax_amount": data.total_tax_amount,
                "grand_total": data.total_amount,
                "pdf_url": pdf_url,
                "user_id": request.user_id,
                "business_gstin": seller.gstin,
                "customer_gstin": buyer.gstin,
                "business_state": seller.state_name,
                "customer_state": buyer.state_name,
                "items": [
                    {
                        "name": item.name,
                        "quantity": item.quantity,
                        "unit": item.unit,
                        "rate": item.rate,
                        "amount": item.amount,
                        "hsn_code": item.hsn_code,
                    }
                    for item in data.items
                ],
            }

            await save_invoice(inv_part, invoice_metadata)
            firestore_saved = True
            log("invoice_uploaded_to_firebase", invoice_id=inv_part, pdf_url=pdf_url)

        except Exception as e:
            log("firebase_upload_error", error=str(e), invoice_id=inv_part)
            # Don't fail the whole operation if Firebase upload fails

    response_msg = f"Invoice PDF generated: {filepath}"
    if pdf_url:
        response_msg += f"\nFirebase URL: {pdf_url}"
    if firestore_saved:
        response_msg += f"\nSaved to Firestore: {inv_part}"

    return ToolResponse(
        response=response_msg,
        status="success",
    )
