import asyncio
import re
from pathlib import Path

import httpx
from fastapi import APIRouter, Request
from google.genai.types import Content, Part
from pydantic import BaseModel

from src.agent.agent import SnapBooksAgent
from src.agent.chat_utils import (
    create_new_chat,
    get_active_chat_id,
    get_chat_history,
    save_chat_history,
)
from src.config import TELEGRAM_API, TELEGRAM_FILE_API
from src.logger import log
from src.models import Role

router = APIRouter(prefix="/telegram", tags=["telegram"])

agent = SnapBooksAgent()

# Deduplication: track recently processed update_ids to prevent Telegram retry spam
_processed_updates: set[int] = set()
_MAX_TRACKED_UPDATES = 1000


# ── Pydantic models for Telegram Update ──────────────────────────────────────


class TelegramUser(BaseModel):
    id: int
    first_name: str | None = None


class TelegramChat(BaseModel):
    id: int
    type: str


class PhotoSize(BaseModel):
    file_id: str
    file_unique_id: str
    width: int
    height: int
    file_size: int | None = None


class TelegramMessage(BaseModel):
    message_id: int
    chat: TelegramChat
    from_user: TelegramUser | None = None
    text: str | None = None
    photo: list[PhotoSize] | None = None
    caption: str | None = None

    model_config = {"populate_by_name": True}


class TelegramUpdate(BaseModel):
    update_id: int
    message: TelegramMessage | None = None


# ── Telegram helpers ─────────────────────────────────────────────────────────


def format_for_telegram(text: str) -> str:
    """Strip markdown for clean Telegram display."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\n)\*([^\*\n]+?)\*(?!\*)", r"\1", text)
    text = re.sub(r"^\* ", "• ", text, flags=re.MULTILINE)
    text = re.sub(r"^- ", "• ", text, flags=re.MULTILINE)
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return text.strip()


def extract_response_text(chat_history) -> str:
    """Extract the final model text response from chat history."""
    if not chat_history.messages:
        return "Processing complete."

    last_message = chat_history.messages[-1]
    if hasattr(last_message, "parts") and last_message.parts:
        text_parts = []
        for part in last_message.parts:
            if getattr(part, "thought", False):
                continue
            if hasattr(part, "text") and part.text:
                text_parts.append(part.text)
        if text_parts:
            return "\n".join(text_parts)

    return "Processing complete."


def extract_invoice_path(chat_history) -> str | None:
    """Scan chat history for a generated invoice PDF path from tool responses."""
    for message in chat_history.messages:
        if not hasattr(message, "parts"):
            continue
        for part in message.parts:
            if hasattr(part, "function_response") and part.function_response:
                content = part.function_response.response.get("content", "")
                if "Invoice PDF generated:" in content:
                    return content.split("Invoice PDF generated: ")[1].strip()
    return None


async def send_message(chat_id: int, text: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{TELEGRAM_API}/sendMessage",
            json={"chat_id": chat_id, "text": text},
        )
        return resp.json()


async def send_typing(chat_id: int):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{TELEGRAM_API}/sendChatAction",
            json={"chat_id": chat_id, "action": "typing"},
        )


async def send_document(chat_id: int, file_path: str, caption: str = "") -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        with open(file_path, "rb") as f:
            resp = await client.post(
                f"{TELEGRAM_API}/sendDocument",
                data={"chat_id": chat_id, "caption": caption},
                files={"document": (Path(file_path).name, f, "application/pdf")},
            )
        return resp.json()


async def download_photo_bytes(file_id: str) -> tuple[bytes, str] | None:
    """Download a photo from Telegram. Returns (bytes, mime_type) or None."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{TELEGRAM_API}/getFile",
            params={"file_id": file_id},
        )
        data = resp.json()
        if not data.get("ok"):
            return None

        file_path = data["result"]["file_path"]
        file_resp = await client.get(f"{TELEGRAM_FILE_API}/{file_path}")
        if file_resp.status_code != 200:
            return None

        ext = Path(file_path).suffix.lower()
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        return file_resp.content, mime_map.get(ext, "image/jpeg")


# ── Webhook ──────────────────────────────────────────────────────────────────


@router.post("/webhook")
async def telegram_webhook(request: Request):
    raw = await request.json()

    if "message" in raw and "from" in raw["message"]:
        raw["message"]["from_user"] = raw["message"].pop("from")

    update = TelegramUpdate(**raw)

    # Deduplicate — skip if we already processed this update
    if update.update_id in _processed_updates:
        log("webhook_duplicate_skipped", update_id=update.update_id)
        return {"ok": True}
    _processed_updates.add(update.update_id)
    # Prevent unbounded memory growth
    if len(_processed_updates) > _MAX_TRACKED_UPDATES:
        oldest = sorted(_processed_updates)[:_MAX_TRACKED_UPDATES // 2]
        _processed_updates.difference_update(oldest)

    message = update.message
    if not message:
        return {"ok": True}

    chat_id = message.chat.id
    telegram_chat_id = str(chat_id)
    log("webhook_received", telegram_chat_id=telegram_chat_id, update_id=update.update_id, has_photo=bool(message.photo), has_text=bool(message.text))

    # ── Text commands (check before photo) ───────────────────────────────
    if message.text:
        text = message.text.strip()

        if text == "/start":
            log("command", command="/start", telegram_chat_id=telegram_chat_id)
            await send_message(
                chat_id,
                "🧾 Welcome to SnapBooks!\n\n"
                "Send me a photo of a handwritten bill (kata parchi) "
                "and I'll extract the data and generate a GST invoice.\n\n"
                "Commands:\n"
                "/start    - Welcome message\n"
                "/new_chat - Start a fresh session\n"
                "/help     - Usage guide",
            )
            return {"ok": True}

        if text == "/new_chat":
            log("command", command="/new_chat", telegram_chat_id=telegram_chat_id)
            new_id = await create_new_chat(telegram_chat_id)
            await send_message(chat_id, f"🆕 New chat started (session: {new_id}). Send a bill photo!")
            return {"ok": True}

        if text == "/help":
            await send_message(
                chat_id,
                "📖 How to use SnapBooks:\n\n"
                "1. Take a photo of your handwritten bill\n"
                "2. Send it here (with optional caption)\n"
                "3. I'll extract items, quantities, amounts\n"
                "4. Get a professional Invoice PDF back!\n\n"
                "/new_chat - Start a fresh conversation",
            )
            return {"ok": True}

        # Regular text → agent pipeline (background)
        asyncio.create_task(_process_text(chat_id, telegram_chat_id, text))
        return {"ok": True}

    # ── Photo → agent pipeline (background) ───────────────────────────────
    if message.photo:
        largest_photo = max(message.photo, key=lambda p: p.width * p.height)
        log("photo_received", telegram_chat_id=telegram_chat_id, file_id=largest_photo.file_id, width=largest_photo.width, height=largest_photo.height)
        asyncio.create_task(_process_photo(chat_id, telegram_chat_id, largest_photo, message.caption))
        return {"ok": True}

    return {"ok": True}


# ── Background processing tasks ──────────────────────────────────────────────


async def _process_text(chat_id: int, telegram_chat_id: str, text: str):
    """Process text message through agent pipeline in background."""
    try:
        await send_typing(chat_id)

        active_chat_id = await get_active_chat_id(telegram_chat_id)
        chat_history = await get_chat_history(active_chat_id)
        chat_history.append_message(text)

        log("agent_start", chat_id=active_chat_id, telegram_chat_id=telegram_chat_id, input_type="text")
        chat_history = await agent.generate_response(chat_history)
        log("agent_complete", chat_id=active_chat_id, cost=chat_history.cost, api_calls=len(chat_history.api_calls))

        await save_chat_history(chat_history)

        text_response = extract_response_text(chat_history)
        formatted = format_for_telegram(text_response)
        await send_message(chat_id, formatted)

        # Send PDF if generated (user may have provided missing details via text)
        invoice_path = extract_invoice_path(chat_history)
        if invoice_path and Path(invoice_path).exists():
            log("invoice_sent", telegram_chat_id=telegram_chat_id, path=invoice_path)
            await send_document(chat_id, invoice_path, caption="📄 Your invoice")
    except Exception as e:
        log("background_text_error", telegram_chat_id=telegram_chat_id, error=str(e))
        await send_message(chat_id, "❌ Something went wrong processing your message. Please try again.")


async def _process_photo(chat_id: int, telegram_chat_id: str, photo: PhotoSize, caption: str | None):
    """Process photo through agent pipeline in background."""
    try:
        await send_typing(chat_id)

        result = await download_photo_bytes(photo.file_id)
        if not result:
            log("photo_download_failed", telegram_chat_id=telegram_chat_id, file_id=photo.file_id)
            await send_message(chat_id, "❌ Failed to download the image.")
            return

        image_bytes, mime_type = result
        log("photo_downloaded", telegram_chat_id=telegram_chat_id, mime_type=mime_type, size_bytes=len(image_bytes))

        active_chat_id = await get_active_chat_id(telegram_chat_id)
        chat_history = await get_chat_history(active_chat_id)

        parts = [Part.from_bytes(data=image_bytes, mime_type=mime_type)]
        caption_text = caption or "Process this bill and generate an invoice."
        parts.append(Part.from_text(text=caption_text))
        chat_history.messages.append(
            Content(role=Role.USER.value, parts=parts)
        )

        log("agent_start", chat_id=active_chat_id, telegram_chat_id=telegram_chat_id)
        chat_history = await agent.generate_response(chat_history)
        log("agent_complete", chat_id=active_chat_id, cost=chat_history.cost, api_calls=len(chat_history.api_calls))

        await save_chat_history(chat_history)

        text_response = extract_response_text(chat_history)
        formatted = format_for_telegram(text_response)
        await send_message(chat_id, formatted)

        invoice_path = extract_invoice_path(chat_history)
        if invoice_path and Path(invoice_path).exists():
            log("invoice_sent", telegram_chat_id=telegram_chat_id, path=invoice_path)
            await send_document(chat_id, invoice_path, caption="📄 Your invoice")
    except Exception as e:
        log("background_photo_error", telegram_chat_id=telegram_chat_id, error=str(e))
        await send_message(chat_id, "❌ Something went wrong processing your bill. Please try again.")
