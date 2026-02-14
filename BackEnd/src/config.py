import os
from pathlib import Path

import dotenv

PROJECT_DIR = Path(__file__).parent  # BackEnd/src
BACKEND_DIR = PROJECT_DIR.parent     # BackEnd
ROOT_DIR = BACKEND_DIR.parent        # repo root

dotenv.load_dotenv(ROOT_DIR / ".env")

MAX_API_CALLS = 10


def get_env(name: str) -> str | None:
    env = os.getenv(name)
    if env:
        env = env.strip()
    return env


GEMINI_API_KEY = get_env("GEMINI_API_KEY")
TELEGRAM_BOT_TOKEN = get_env("TELEGRAM_BOT_TOKEN")

SYSTEM_PROMPT_PATH = str(PROJECT_DIR / "agent" / "Agent.md")

TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
TELEGRAM_FILE_API = f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}"

# Firebase — service account JSON path (relative to BACKEND_DIR or absolute)
FIREBASE_SERVICE_ACCOUNT = get_env("FIREBASE_SERVICE_ACCOUNT")
if FIREBASE_SERVICE_ACCOUNT and not Path(FIREBASE_SERVICE_ACCOUNT).is_absolute():
    FIREBASE_SERVICE_ACCOUNT = str(BACKEND_DIR / FIREBASE_SERVICE_ACCOUNT)
