"""REST API endpoints for frontend dashboard."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.firebase import get_db
from src.logger import log

router = APIRouter(prefix="/api", tags=["api"])


class InvoiceResponse(BaseModel):
    """Response model for invoice data."""
    id: str
    invoice_number: str | None = None
    customer_name: str | None = None
    date: str | None = None
    grand_total: float = 0
    created_at: str | None = None
    document_type: str | None = None
    pdf_url: str | None = None
    xml_url: str | None = None


class InvoicesListResponse(BaseModel):
    """Response model for invoices list."""
    success: bool = True
    count: int
    invoices: list[dict]


class StatsResponse(BaseModel):
    """Response model for statistics."""
    success: bool = True
    stats: dict


@router.get("/invoices", response_model=InvoicesListResponse)
async def get_invoices(limit: int = 50, userId: str | None = None):
    """
    Get all invoices with optional filtering.

    Args:
        limit: Maximum number of invoices to return (default: 50)
        userId: Optional user ID to filter by
    """
    try:
        db = get_db()
        query = db.collection('invoices').order_by(
            'created_at', direction='DESCENDING'
        ).limit(limit)

        if userId:
            query = query.where('user_id', '==', userId)

        docs = await query.get()

        invoices = []
        for doc in docs:
            data = doc.to_dict()
            # Convert Firestore timestamp to ISO string
            if data.get('created_at'):
                data['created_at'] = data['created_at'].isoformat() if hasattr(data['created_at'], 'isoformat') else str(data['created_at'])

            invoices.append({
                'id': doc.id,
                **data
            })

        log("invoices_fetched", count=len(invoices), user_id=userId)
        return InvoicesListResponse(count=len(invoices), invoices=invoices)

    except Exception as e:
        log("invoices_fetch_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    """Get a single invoice by ID."""
    try:
        db = get_db()
        doc = await db.collection('invoices').document(invoice_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")

        data = doc.to_dict()
        # Convert timestamp
        if data.get('created_at'):
            data['created_at'] = data['created_at'].isoformat() if hasattr(data['created_at'], 'isoformat') else str(data['created_at'])

        log("invoice_fetched", invoice_id=invoice_id)
        return {
            "success": True,
            "invoice": {
                "id": doc.id,
                **data
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        log("invoice_fetch_error", invoice_id=invoice_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get invoice statistics."""
    try:
        db = get_db()
        docs = await db.collection('invoices').get()

        total_revenue = 0
        document_types = {}

        for doc in docs:
            data = doc.to_dict()
            total_revenue += data.get('grand_total', 0)

            doc_type = data.get('document_type', 'unknown')
            document_types[doc_type] = document_types.get(doc_type, 0) + 1

        stats = {
            "totalInvoices": len(docs),
            "totalRevenue": total_revenue,
            "documentTypes": document_types
        }

        log("stats_fetched", total_invoices=len(docs), total_revenue=total_revenue)
        return StatsResponse(stats=stats)

    except Exception as e:
        log("stats_fetch_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "success": True,
        "message": "SnapBooks API is running",
        "service": "Python FastAPI Backend"
    }
