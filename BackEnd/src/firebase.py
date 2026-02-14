import firebase_admin
from firebase_admin import credentials, firestore_async, storage

from src.config import FIREBASE_SERVICE_ACCOUNT
from src.logger import log

_app: firebase_admin.App | None = None
_db = None
_bucket = None


def get_app():
    """Get Firebase app, initializing on first call."""
    global _app
    if _app is not None:
        return _app

    if not FIREBASE_SERVICE_ACCOUNT:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT not set in .env")

    cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)

    # Get project ID from service account
    import json
    with open(FIREBASE_SERVICE_ACCOUNT) as f:
        service_account_data = json.load(f)
        project_id = service_account_data.get("project_id")

    _app = firebase_admin.initialize_app(cred, {
        'storageBucket': f'{project_id}.appspot.com'
    })
    log("firebase_initialized", project=project_id)
    return _app


def get_db():
    """Get async Firestore client."""
    global _db
    if _db is not None:
        return _db

    get_app()  # Ensure app is initialized
    _db = firestore_async.client()
    return _db


def get_storage():
    """Get Firebase Storage bucket."""
    global _bucket
    if _bucket is not None:
        return _bucket

    get_app()  # Ensure app is initialized
    _bucket = storage.bucket()
    return _bucket


async def save_invoice(invoice_id: str, invoice_data: dict):
    """Save invoice metadata to Firestore."""
    db = get_db()

    # Add timestamps
    invoice_data['created_at'] = firestore_async.SERVER_TIMESTAMP
    invoice_data['updated_at'] = firestore_async.SERVER_TIMESTAMP

    await db.collection('invoices').document(invoice_id).set(invoice_data)
    log("invoice_saved", invoice_id=invoice_id)


async def upload_file(file_bytes: bytes, destination_path: str, content_type: str) -> str:
    """Upload file to Firebase Storage and return public URL."""
    bucket = get_storage()
    blob = bucket.blob(destination_path)

    # Upload file
    blob.upload_from_string(file_bytes, content_type=content_type)

    # Make it publicly accessible
    blob.make_public()

    public_url = blob.public_url
    log("file_uploaded", path=destination_path, url=public_url)
    return public_url
