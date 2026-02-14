"""REST API routes for the frontend dashboard.

All endpoints gracefully handle missing Firebase configuration
by returning empty results instead of crashing.
"""

from fastapi import APIRouter

from src.logger import log

router = APIRouter(prefix="/api", tags=["api"])


def _get_db_or_none():
    """Try to get Firestore client; return None if Firebase isn't configured."""
    try:
        from src.firebase import get_db
        return get_db()
    except Exception:
        return None


@router.get("/invoices")
async def list_invoices(limit: int = 50, userId: str | None = None):
    """List invoices from Firestore."""
    db = _get_db_or_none()
    if db is None:
        return {"success": True, "count": 0, "invoices": [], "note": "Firebase not configured"}

    try:
        query = db.collection("invoices").limit(limit)
        if userId:
            query = query.where("user_id", "==", userId)
        docs = await query.get()

        invoices = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("created_at") and hasattr(data["created_at"], "isoformat"):
                data["created_at"] = data["created_at"].isoformat()
            invoices.append({"id": doc.id, **data})

        log("invoices_fetched", count=len(invoices))
        return {"success": True, "count": len(invoices), "invoices": invoices}
    except Exception as e:
        log("api_invoices_error", error=str(e))
        return {"success": False, "error": str(e), "invoices": []}


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    """Get a single invoice by ID."""
    db = _get_db_or_none()
    if db is None:
        return {"success": False, "error": "Firebase not configured"}

    try:
        doc = await db.collection("invoices").document(invoice_id).get()
        if not doc.exists:
            return {"success": False, "error": "Invoice not found"}

        data = doc.to_dict()
        if data.get("created_at") and hasattr(data["created_at"], "isoformat"):
            data["created_at"] = data["created_at"].isoformat()

        return {"success": True, "invoice": {"id": doc.id, **data}}
    except Exception as e:
        log("api_invoice_error", error=str(e))
        return {"success": False, "error": str(e)}


@router.get("/stats")
async def get_stats():
    """Get invoice statistics."""
    db = _get_db_or_none()
    if db is None:
        return {
            "success": True,
            "stats": {"totalInvoices": 0, "totalRevenue": 0, "documentTypes": {}},
            "note": "Firebase not configured",
        }

    try:
        docs = await db.collection("invoices").get()

        total_revenue = 0
        document_types: dict[str, int] = {}
        for doc in docs:
            data = doc.to_dict()
            total_revenue += data.get("grand_total", 0)
            doc_type = data.get("document_type", "unknown")
            document_types[doc_type] = document_types.get(doc_type, 0) + 1

        return {
            "success": True,
            "stats": {
                "totalInvoices": len(docs),
                "totalRevenue": total_revenue,
                "documentTypes": document_types,
            },
        }
    except Exception as e:
        log("api_stats_error", error=str(e))
        return {"success": False, "error": str(e)}


@router.get("/contacts")
async def list_contacts(q: str = ""):
    """List/search contacts."""
    db = _get_db_or_none()
    if db is None:
        return {"success": True, "count": 0, "contacts": [], "note": "Firebase not configured"}

    try:
        docs = await db.collection("contacts").get()
        contacts = []
        query_lower = q.lower()
        for doc in docs:
            data = doc.to_dict()
            if not q or query_lower in data.get("name", "").lower():
                contacts.append({"id": doc.id, **data})
        return {"success": True, "count": len(contacts), "contacts": contacts}
    except Exception as e:
        log("api_contacts_error", error=str(e))
        return {"success": False, "error": str(e)}


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    from src.firebase import get_app
    firebase_ok = get_app() is not None
    return {
        "success": True,
        "service": "SnapBooks API",
        "firebase": "connected" if firebase_ok else "not configured",
    }
