import os
import warnings

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.logger import log
from src.server.routes_telegram import router as telegram_router

warnings.filterwarnings("ignore", category=UserWarning, module="google.genai")

app = FastAPI(
    title="SnapBooks API",
    description="Telegram AI Accountant for Indian SMBs",
    version="0.1.0",
)

app.include_router(telegram_router)


@app.get("/")
async def health():
    return {"status": "ok", "service": "SnapBooks"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"message": f"An unexpected error occurred: {str(exc)}"},
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("src.server.server:app", host="0.0.0.0", port=port, reload=True)
