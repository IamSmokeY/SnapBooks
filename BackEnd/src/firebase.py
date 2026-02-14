"""Firebase integration — Firestore + Storage.

All functions gracefully handle the case where Firebase is not configured.
The bot works without Firebase (using in-memory storage in chat_utils).
"""

from src.config import FIREBASE_SERVICE_ACCOUNT
from src.logger import log

_app = None
_db = None
_bucket = None
_init_attempted = False
_init_error = None


def _ensure_init():
    """Lazy-initialize Firebase on first use. Caches the result."""
    global _app, _init_attempted, _init_error
    if _init_attempted:
        return _app is not None

    _init_attempted = True

    if not FIREBASE_SERVICE_ACCOUNT:
        _init_error = "FIREBASE_SERVICE_ACCOUNT not set in .env"
        log("firebase_skip", reason=_init_error)
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials
        import json

        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
        with open(FIREBASE_SERVICE_ACCOUNT) as f:
            project_id = json.load(f).get("project_id")

        _app = firebase_admin.initialize_app(cred, {
            "storageBucket": f"{project_id}.appspot.com",
        })
        log("firebase_initialized", project=project_id)
        return True
    except Exception as e:
        _init_error = str(e)
        log("firebase_init_error", error=_init_error)
        return False


def get_app():
    """Get Firebase app. Returns None if not configured."""
    if _ensure_init():
        return _app
    return None


def get_db():
    """Get async Firestore client. Raises RuntimeError if not available."""
    global _db
    if _db is not None:
        return _db

    if not _ensure_init():
        raise RuntimeError(
            f"Firebase not available: {_init_error}. "
            "Bot works without Firebase (in-memory storage), "
            "but Firestore features require it."
        )

    from firebase_admin import firestore_async
    _db = firestore_async.client()
    return _db


def get_storage():
    """Get Firebase Storage bucket. Returns None if not available."""
    global _bucket
    if _bucket is not None:
        return _bucket

    if not _ensure_init():
        return None

    try:
        from firebase_admin import storage
        _bucket = storage.bucket()
        return _bucket
    except Exception as e:
        log("storage_init_error", error=str(e))
        return None


async def save_invoice(invoice_id: str, invoice_data: dict):
    """Save invoice metadata to Firestore. No-op if Firebase not configured."""
    try:
        db = get_db()
    except RuntimeError:
        log("save_invoice_skip", reason="Firebase not configured", invoice_id=invoice_id)
        return

    from firebase_admin import firestore_async as fa
    invoice_data["created_at"] = fa.SERVER_TIMESTAMP
    invoice_data["updated_at"] = fa.SERVER_TIMESTAMP
    await db.collection("invoices").document(invoice_id).set(invoice_data)
    log("invoice_saved", invoice_id=invoice_id)


async def upload_file(file_bytes: bytes, destination_path: str, content_type: str) -> str | None:
    """Upload file to Firebase Storage. Returns URL or None if not configured."""
    bucket = get_storage()
    if bucket is None:
        log("upload_file_skip", reason="Firebase Storage not configured", path=destination_path)
        return None

    blob = bucket.blob(destination_path)
    blob.upload_from_string(file_bytes, content_type=content_type)
    blob.make_public()
    public_url = blob.public_url
    log("file_uploaded", path=destination_path, url=public_url)
    return public_url
