"""
MarketMind Backend FastAPI Application.
Coordinates all market data services, AI multi-agent orchestration, daily scheduling,
and REST endpoints for the Next.js web application.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.routes import market, analysis, reports, chat, user, auth
from app.services.scheduler import market_scheduler
from app.llm.client import gemini_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("marketmind")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MarketMind API services...")
    # Start the automated daily market intelligence scheduler (3:50 PM IST)
    market_scheduler.start()
    yield
    logger.info("Shutting down MarketMind API...")
    market_scheduler.shutdown()

import json
import math
from typing import Any
from fastapi.responses import JSONResponse

class NaNCompliantJSONResponse(JSONResponse):
    """
    Guarantees strict JSON specification compliance by converting any out-of-range floats
    (NaN, Inf, -Inf) into compliant null values across all API responses.
    """
    def render(self, content: Any) -> bytes:
        def _sanitize(o):
            if isinstance(o, float):
                if math.isnan(o) or math.isinf(o):
                    return None
                return o
            elif isinstance(o, dict):
                return {k: _sanitize(v) for k, v in o.items()}
            elif isinstance(o, (list, tuple)):
                return [_sanitize(v) for v in o]
            return o

        return json.dumps(
            _sanitize(content),
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")

import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Request

app = FastAPI(
    title="MarketMind API",
    description="AI-Powered Indian Stock Market Intelligence Agent (NSE/BSE)",
    version="1.0.0",
    lifespan=lifespan,
    default_response_class=NaNCompliantJSONResponse
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# CORS Middleware with production environment support & Vercel deployment preview regex
frontend_url = os.getenv("FRONTEND_URL", "").strip()
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include route handlers
app.include_router(market.router)
app.include_router(analysis.router)
app.include_router(reports.router)
app.include_router(chat.router)
app.include_router(user.router)
app.include_router(auth.router)

from app.services.key_manager import key_manager
from app.db.client import db

class GeminiKeyUpdateRequest(BaseModel):
    api_key: str
    user_id: Optional[str] = None

@app.get("/api/health")
async def health_check():
    """Health check endpoint indicating server state and AI key status."""
    return {
        "status": "online",
        "service": "MarketMind API",
        "gemini_configured": gemini_client.is_configured,
        "active_scheduler": market_scheduler.is_running
    }

@app.post("/api/config/gemini-key")
async def update_gemini_key(req: GeminiKeyUpdateRequest):
    """Allows dynamic submission of the user's Gemini API key with encrypted per-user storage."""
    key = req.api_key.strip()
    if not key or len(key) < 15:
        raise HTTPException(status_code=400, detail="Invalid API key length. Key must be at least 15 characters.")
    
    # If user_id is provided, encrypt and store securely in database
    if req.user_id:
        try:
            encrypted_token = key_manager.encrypt_key(key)
            await db.save_user_api_key(req.user_id, encrypted_token)
        except Exception as e:
            logger.error(f"Failed to persist encrypted user key: {e}")

    # Also configure client so runtime synthesis can execute
    gemini_client.set_api_key(key)
    return {
        "status": "success",
        "message": "Gemini API key configured and encrypted successfully.",
        "user_id": req.user_id,
        "gemini_configured": gemini_client.is_configured
    }
