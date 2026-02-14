import json
import uuid
from pathlib import Path

from src.config import ROOT_DIR
from src.logger import log
from src.models import ChatHistory

CHAT_HISTORY_DIR = ROOT_DIR / "chat_history"
CHAT_HISTORY_DIR.mkdir(exist_ok=True)

# Single file mapping telegram_chat_id → active chat UUID
# Will move to Firestore later
ACTIVE_SESSIONS_FILE = CHAT_HISTORY_DIR / "active_sessions.json"


def _load_sessions() -> dict:
    if ACTIVE_SESSIONS_FILE.exists():
        return json.loads(ACTIVE_SESSIONS_FILE.read_text())
    return {}


def _save_sessions(sessions: dict):
    ACTIVE_SESSIONS_FILE.write_text(json.dumps(sessions, indent=2))


def _history_path(chat_id: str) -> Path:
    chat_dir = CHAT_HISTORY_DIR / chat_id
    chat_dir.mkdir(parents=True, exist_ok=True)
    return chat_dir / "history.json"


async def get_active_chat_id(telegram_chat_id: str) -> str:
    sessions = _load_sessions()
    if telegram_chat_id in sessions:
        return sessions[telegram_chat_id]
    return await create_new_chat(telegram_chat_id)


async def create_new_chat(telegram_chat_id: str) -> str:
    chat_id = uuid.uuid4().hex[:12]
    sessions = _load_sessions()
    sessions[telegram_chat_id] = chat_id
    _save_sessions(sessions)

    await save_chat_history(ChatHistory(chat_id=chat_id))
    log("new_chat_created", chat_id=chat_id, telegram_chat_id=telegram_chat_id)
    return chat_id


async def get_chat_history(chat_id: str) -> ChatHistory:
    path = _history_path(chat_id)
    if path.exists():
        return ChatHistory(**json.loads(path.read_text()))

    chat_history = ChatHistory(chat_id=chat_id)
    await save_chat_history(chat_history)
    return chat_history


async def save_chat_history(chat_history: ChatHistory):
    path = _history_path(chat_history.chat_id)
    data = json.loads(chat_history.model_dump_json())
    path.write_text(json.dumps(data, indent=2))
