import base64
import json
import uuid

from google.genai.types import Content, Part

from src.logger import log
from src.models import ChatHistory

# ── Storage backend (Firebase or in-memory fallback) ─────────────────────────

_memory_store: dict[str, dict] = {}  # fallback when Firebase is unavailable


def _get_db_or_none():
    """Try to get Firestore client; return None if Firebase isn't configured."""
    try:
        from src.firebase import get_db
        return get_db()
    except Exception:
        return None


# ── Content serialization helpers ────────────────────────────────────────────
# google.genai Content objects contain binary image data (bytes) that can't be
# JSON serialized directly. We base64-encode inline_data and decode on load.


def _serialize_part(part_dict: dict) -> dict:
    """Base64-encode any binary inline_data in a Part dict."""
    if part_dict.get("inline_data") and isinstance(part_dict["inline_data"].get("data"), bytes):
        part_dict["inline_data"]["data"] = base64.b64encode(
            part_dict["inline_data"]["data"]
        ).decode("ascii")
        part_dict["inline_data"]["_b64"] = True
    return part_dict


def _deserialize_part(part_dict: dict) -> dict:
    """Decode base64 inline_data back to bytes."""
    if (
        part_dict.get("inline_data")
        and part_dict["inline_data"].get("_b64")
    ):
        part_dict["inline_data"]["data"] = base64.b64decode(
            part_dict["inline_data"]["data"]
        )
        del part_dict["inline_data"]["_b64"]
    return part_dict


def serialize_chat_history(chat_history: ChatHistory) -> str:
    """Serialize ChatHistory to JSON string, handling binary image data."""
    data = {
        "chat_id": chat_history.chat_id,
        "cost": chat_history.cost,
        "api_calls": chat_history.api_calls,
        "title": chat_history.title,
        "created_at": chat_history.created_at.isoformat(),
        "messages": [],
    }
    for msg in chat_history.messages:
        msg_dict = msg.model_dump()
        if msg_dict.get("parts"):
            msg_dict["parts"] = [_serialize_part(p) for p in msg_dict["parts"]]
        data["messages"].append(msg_dict)
    return json.dumps(data)


def deserialize_chat_history(json_str: str) -> ChatHistory:
    """Deserialize ChatHistory from JSON string, restoring binary data."""
    data = json.loads(json_str)
    messages = []
    for msg_dict in data.get("messages", []):
        if msg_dict.get("parts"):
            msg_dict["parts"] = [_deserialize_part(p) for p in msg_dict["parts"]]
        messages.append(Content(**msg_dict))
    return ChatHistory(
        chat_id=data.get("chat_id", ""),
        messages=messages,
        cost=data.get("cost", 0.0),
        api_calls=data.get("api_calls", []),
        title=data.get("title", "Untitled"),
    )


# ── Chat management ─────────────────────────────────────────────────────────


async def get_active_chat_id(telegram_chat_id: str) -> str:
    """Get the active chat ID for a Telegram user, or create a new one."""
    db = _get_db_or_none()
    if db:
        user_ref = db.collection("users").document(telegram_chat_id)
        user_doc = await user_ref.get()
        if user_doc.exists:
            data = user_doc.to_dict()
            active_id = data.get("active_chat_id")
            if active_id:
                return active_id
    else:
        user_data = _memory_store.get(f"user:{telegram_chat_id}")
        if user_data and user_data.get("active_chat_id"):
            return user_data["active_chat_id"]

    return await create_new_chat(telegram_chat_id)


async def create_new_chat(telegram_chat_id: str) -> str:
    """Create a new chat session and set it as active."""
    chat_id = uuid.uuid4().hex[:12]

    db = _get_db_or_none()
    if db:
        user_ref = db.collection("users").document(telegram_chat_id)
        await user_ref.set({"active_chat_id": chat_id}, merge=True)
    else:
        _memory_store[f"user:{telegram_chat_id}"] = {"active_chat_id": chat_id}

    # Create empty chat history
    chat_history = ChatHistory(chat_id=chat_id)
    await save_chat_history(chat_history, telegram_chat_id)

    log("new_chat_created", chat_id=chat_id, telegram_chat_id=telegram_chat_id)
    return chat_id


async def get_chat_history(chat_id: str, telegram_chat_id: str = "") -> ChatHistory:
    """Load chat history from storage."""
    db = _get_db_or_none()

    if db and telegram_chat_id:
        try:
            doc_ref = db.collection("users").document(telegram_chat_id).collection("chats").document(chat_id)
            doc = await doc_ref.get()
            if doc.exists:
                return deserialize_chat_history(doc.to_dict()["data"])
        except Exception as e:
            log("chat_history_load_error", error=str(e), chat_id=chat_id)
    else:
        key = f"chat:{telegram_chat_id}:{chat_id}"
        if key in _memory_store:
            try:
                return deserialize_chat_history(_memory_store[key]["data"])
            except Exception as e:
                log("chat_history_load_error", error=str(e), chat_id=chat_id)

    # Fallback: create new
    chat_history = ChatHistory(chat_id=chat_id)
    if telegram_chat_id:
        await save_chat_history(chat_history, telegram_chat_id)
    return chat_history


async def save_chat_history(chat_history: ChatHistory, telegram_chat_id: str = ""):
    """Save chat history to storage."""
    if not telegram_chat_id:
        return

    try:
        data_json = serialize_chat_history(chat_history)
    except Exception as e:
        log("chat_history_serialize_error", error=str(e), chat_id=chat_history.chat_id)
        return

    doc_data = {
        "data": data_json,
        "chat_id": chat_history.chat_id,
        "cost": chat_history.cost,
        "api_calls_count": len(chat_history.api_calls),
        "title": chat_history.title,
        "updated_at": chat_history.created_at.isoformat(),
    }

    db = _get_db_or_none()
    if db:
        try:
            doc_ref = db.collection("users").document(telegram_chat_id).collection("chats").document(chat_history.chat_id)
            await doc_ref.set(doc_data)
        except Exception as e:
            log("chat_history_save_error", error=str(e), chat_id=chat_history.chat_id)
            # Fallback to memory
            key = f"chat:{telegram_chat_id}:{chat_history.chat_id}"
            _memory_store[key] = doc_data
    else:
        key = f"chat:{telegram_chat_id}:{chat_history.chat_id}"
        _memory_store[key] = doc_data
