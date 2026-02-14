import json
import uuid

from src.firebase import get_db
from src.logger import log
from src.models import ChatHistory


# Firestore collections:
#   users/{telegram_chat_id}          — active_chat_id, created_at
#   users/{telegram_chat_id}/chats/{chat_id} — serialized ChatHistory


async def get_active_chat_id(telegram_chat_id: str) -> str:
    """Get the active chat ID for a Telegram user, or create a new one."""
    db = get_db()
    user_ref = db.collection("users").document(telegram_chat_id)
    user_doc = await user_ref.get()

    if user_doc.exists:
        data = user_doc.to_dict()
        active_id = data.get("active_chat_id")
        if active_id:
            return active_id

    return await create_new_chat(telegram_chat_id)


async def create_new_chat(telegram_chat_id: str) -> str:
    """Create a new chat session and set it as active."""
    db = get_db()
    chat_id = uuid.uuid4().hex[:12]

    # Set active chat on user doc
    user_ref = db.collection("users").document(telegram_chat_id)
    await user_ref.set({"active_chat_id": chat_id}, merge=True)

    # Create empty chat history doc
    chat_history = ChatHistory(chat_id=chat_id)
    await save_chat_history(chat_history, telegram_chat_id)

    log("new_chat_created", chat_id=chat_id, telegram_chat_id=telegram_chat_id)
    return chat_id


async def get_chat_history(chat_id: str, telegram_chat_id: str = "") -> ChatHistory:
    """Load chat history from Firestore."""
    db = get_db()

    # Try to find the chat under the user's subcollection
    if telegram_chat_id:
        doc_ref = db.collection("users").document(telegram_chat_id).collection("chats").document(chat_id)
        doc = await doc_ref.get()
        if doc.exists:
            return ChatHistory(**json.loads(doc.to_dict()["data"]))

    # Fallback: create new
    chat_history = ChatHistory(chat_id=chat_id)
    if telegram_chat_id:
        await save_chat_history(chat_history, telegram_chat_id)
    return chat_history


async def save_chat_history(chat_history: ChatHistory, telegram_chat_id: str = ""):
    """Save chat history to Firestore."""
    if not telegram_chat_id:
        return

    db = get_db()
    doc_ref = db.collection("users").document(telegram_chat_id).collection("chats").document(chat_history.chat_id)

    # Serialize ChatHistory to JSON string (Content objects need JSON serialization)
    data_json = chat_history.model_dump_json()
    await doc_ref.set({
        "data": data_json,
        "chat_id": chat_history.chat_id,
        "cost": chat_history.cost,
        "api_calls_count": len(chat_history.api_calls),
        "title": chat_history.title,
        "updated_at": chat_history.created_at.isoformat(),
    })
