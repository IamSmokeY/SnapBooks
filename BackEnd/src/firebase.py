import firebase_admin
from firebase_admin import credentials, firestore_async

from src.config import FIREBASE_SERVICE_ACCOUNT
from src.logger import log

_app: firebase_admin.App | None = None
_db = None


def get_db():
    """Get async Firestore client, initializing Firebase app on first call."""
    global _app, _db
    if _db is not None:
        return _db

    if not FIREBASE_SERVICE_ACCOUNT:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT not set in .env")

    cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
    _app = firebase_admin.initialize_app(cred)
    _db = firestore_async.client()
    log("firestore_initialized", project=_app.project_id)
    return _db
