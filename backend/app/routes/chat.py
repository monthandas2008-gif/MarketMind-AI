"""
Chat API route for 'Ask MarketMind'.
Accepts free-form user questions, delegates to Orchestrator, and returns evidence-backed responses.
Includes rate limiting and support for user-supplied Gemini API keys.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Request

from app.models.chat import ChatRequest, ChatResponse
from app.agents.orchestrator import orchestrator_service
from app.middleware.rate_limiter import rate_limiter
from app.services.key_manager import key_manager
from app.db.client import db

router = APIRouter(prefix="/api/chat", tags=["Ask MarketMind"])


@router.post("", response_model=ChatResponse)
async def ask_marketmind(req: ChatRequest, request: Request):
    """
    Submits a conversational financial query to MarketMind.
    Determines intent and selectively runs the necessary AI agents and data tools.
    Enforces 15 queries/hour rate limiting unless user has supplied their own Gemini key.
    """
    query_text = req.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if len(query_text) > 2000:
        raise HTTPException(status_code=400, detail="Query length exceeds 2000 characters.")

    # Check for user-specific custom Gemini key
    user_api_key: Optional[str] = None
    if req.custom_key and len(req.custom_key.strip()) >= 15:
        user_api_key = req.custom_key.strip()
    elif req.user_id:
        encrypted = await db.get_user_api_key(req.user_id)
        if encrypted:
            user_api_key = key_manager.decrypt_key(encrypted)

    # Enforce rate limiter (bypassed if custom key is present)
    rate_limiter.check_ai_limit(
        request=request,
        user_id=req.user_id,
        custom_key_present=bool(user_api_key)
    )

    try:
        response = await orchestrator_service.answer_query(
            query=query_text,
            user_id=req.user_id,
            user_api_key=user_api_key
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {e}")


@router.get("/history")
async def get_query_history(limit: int = 10):
    """Returns recent questions asked by users."""
    try:
        if db.use_supabase:
            res = db.supabase.table("chat_queries").select("*").order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        else:
            import sqlite3
            conn = sqlite3.connect(db.local_db_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM chat_queries ORDER BY created_at DESC LIMIT ?", (limit,))
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {e}")
