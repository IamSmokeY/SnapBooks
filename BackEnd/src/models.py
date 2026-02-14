import json
from datetime import datetime
from enum import Enum
from typing import Any, Literal

from google import genai
from google.genai import types
from google.genai.types import Content, Part
from pydantic import BaseModel, Field, field_validator

from src import config


class Role(str, Enum):
    USER = "user"
    MODEL = "model"


class ToolResponse(BaseModel):
    response: str
    status: Literal["success", "error"] = "success"

    @field_validator("response", mode="before")
    @classmethod
    def serialize_response(cls, v: Any) -> str:
        if isinstance(v, str):
            return v
        return json.dumps(v)


class ModelCard(BaseModel):
    id: str
    name: str
    input_cost: float  # $ per million tokens
    output_cost: float

    def calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        return (input_tokens / 1_000_000) * self.input_cost + (output_tokens / 1_000_000) * self.output_cost


class GeminiModel(Enum):
    FLASH = ModelCard(
        id="gemini-3-flash-preview",
        name="Gemini 3 Flash",
        input_cost=0.50,
        output_cost=3.00,
    )

    @classmethod
    def get_client(cls):
        """Returns the async Gemini client."""
        retry_config = types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                attempts=2,
                initial_delay=1.0,
                max_delay=10.0,
                exp_base=2.0,
            )
        )
        return genai.Client(
            api_key=config.GEMINI_API_KEY,
            http_options=retry_config,
        ).aio


# ── Chat history ─────────────────────────────────────────────────────────────


class ChatHistory(BaseModel):
    chat_id: str = ""
    messages: list[Content] = []
    cost: float = 0.0
    api_calls: list[dict] = []
    title: str = "Untitled"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def add_api_call(self, usage_metadata, model_card: ModelCard):
        prompt_tokens = usage_metadata.prompt_token_count or 0
        candidates_tokens = usage_metadata.candidates_token_count or 0
        total_tokens = usage_metadata.total_token_count or 0
        cached_tokens = usage_metadata.cached_content_token_count or 0
        thinking_tokens = total_tokens - prompt_tokens - candidates_tokens
        output_tokens = candidates_tokens + thinking_tokens

        billable_input = max(0, prompt_tokens - cached_tokens)
        request_cost = model_card.calculate_cost(billable_input, output_tokens)
        self.cost += request_cost

        self.api_calls.append({
            "call": len(self.api_calls) + 1,
            "input_tokens": prompt_tokens,
            "cached_tokens": cached_tokens,
            "thinking_tokens": thinking_tokens,
            "output_tokens": candidates_tokens,
            "cost": request_cost,
        })
        return request_cost

    def append_message(self, message: str):
        self.messages.append(
            Content(role=Role.USER.value, parts=[Part(text=message)])
        )


# ── Contact models ───────────────────────────────────────────────────────────


class Contact(BaseModel):
    contact_id: str = ""
    name: str = Field(..., description="Company/person name")
    address: str | None = Field(None, description="Full address")
    city: str | None = Field(None, description="City")
    state: str | None = Field(None, description="State")
    gstin: str | None = Field(None, description="GSTIN number")
    phone: str | None = Field(None, description="Phone number")
    email: str | None = Field(None, description="Email address")


# ── Invoice models ───────────────────────────────────────────────────────────


class SellerDetails(BaseModel):
    name: str = Field(..., description="Seller/company name")
    address: str | None = Field(None, description="Full address")
    gstin: str | None = Field(None, description="GSTIN/UIN")
    state_name: str | None = Field(None, description="State name")
    state_code: str | None = Field(None, description="State code (2-digit)")
    pan: str | None = Field(None, description="PAN number")
    cin: str | None = Field(None, description="CIN number")
    udyam_registration: str | None = Field(None, description="Udyam registration number")
    contact: str | None = Field(None, description="Phone/contact numbers")
    email: str | None = Field(None, description="Email address")


class BuyerDetails(BaseModel):
    name: str = Field(..., description="Buyer/consignee name")
    address: str | None = Field(None, description="Full address")
    gstin: str | None = Field(None, description="GSTIN/UIN")
    state_name: str | None = Field(None, description="State name")
    state_code: str | None = Field(None, description="State code (2-digit)")
    place_of_supply: str | None = Field(None, description="Place of supply (state)")


class BankDetails(BaseModel):
    account_holder: str = Field(..., description="A/C holder name")
    bank_name: str = Field(..., description="Bank name")
    account_no: str = Field(..., description="Account number")
    branch_ifsc: str = Field(..., description="Branch & IFSC code")


class InvoiceItem(BaseModel):
    name: str = Field(..., description="Item/description of goods")
    hsn_code: str | None = Field(None, description="HSN/SAC code")
    quantity: float = Field(..., description="Quantity")
    unit: str = Field("pcs", description="Unit of measurement (pcs, kg, TON, m, etc.)")
    rate: float = Field(..., description="Rate per unit in INR")
    amount: float = Field(..., description="Total amount before tax (quantity * rate)")


class HsnSummaryItem(BaseModel):
    hsn_code: str = Field(..., description="HSN/SAC code")
    taxable_value: float = Field(..., description="Taxable value")
    tax_rate: float = Field(..., description="Tax rate percentage")
    tax_amount: float = Field(..., description="Tax amount")


class InvoiceData(BaseModel):
    document_type: str = Field(
        "tax_invoice",
        description="Type: tax_invoice, purchase_order, proforma_invoice, delivery_challan",
    )

    # Parties
    seller: SellerDetails = Field(..., description="Seller/company details")
    consignee: BuyerDetails | None = Field(None, description="Consignee (Ship to) — if different from buyer")
    buyer: BuyerDetails = Field(..., description="Buyer (Bill to) details")

    # Invoice metadata
    invoice_number: str | None = Field(None, description="Invoice number")
    date: str = Field(..., description="Date in DD-MMM-YY or DD/MM/YYYY format")
    delivery_note: str | None = Field(None, description="Delivery note")
    payment_terms: str | None = Field(None, description="Mode/terms of payment")
    reference_no: str | None = Field(None, description="Reference no. & date")
    buyers_order_no: str | None = Field(None, description="Buyer's order number")
    dispatch_doc_no: str | None = Field(None, description="Dispatch doc number")
    delivery_note_date: str | None = Field(None, description="Delivery note date")
    dispatched_through: str | None = Field(None, description="Dispatched through")
    destination: str | None = Field(None, description="Destination")
    bill_of_lading_no: str | None = Field(None, description="Bill of Lading/LR-RR No.")
    motor_vehicle_no: str | None = Field(None, description="Motor vehicle number")
    terms_of_delivery: str | None = Field(None, description="Terms of delivery")

    # Items
    items: list[InvoiceItem] = Field(..., description="List of line items")

    # Totals & Tax
    subtotal: float = Field(..., description="Sum of all item amounts before tax")
    tax_type: str = Field("cgst_sgst", description="'igst' for inter-state or 'cgst_sgst' for intra-state")
    igst_rate: float | None = Field(None, description="IGST rate % (inter-state)")
    igst_amount: float | None = Field(None, description="IGST amount")
    cgst_rate: float | None = Field(None, description="CGST rate % (intra-state)")
    cgst_amount: float | None = Field(None, description="CGST amount")
    sgst_rate: float | None = Field(None, description="SGST rate % (intra-state)")
    sgst_amount: float | None = Field(None, description="SGST amount")
    total_tax_amount: float = Field(..., description="Total tax amount")
    total_amount: float = Field(..., description="Grand total including tax")

    # HSN summary
    hsn_summary: list[HsnSummaryItem] | None = Field(None, description="HSN/SAC-wise tax summary")

    # Bank & footer
    bank_details: BankDetails | None = Field(None, description="Company bank details")
    declaration: str | None = Field(None, description="Declaration text")
    jurisdiction: str | None = Field(None, description="Jurisdiction statement")
    notes: str | None = Field(None, description="Any additional notes")
