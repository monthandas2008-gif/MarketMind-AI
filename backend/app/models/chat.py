"""
Pydantic models for user chat queries and conversational intelligence responses.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    custom_key: Optional[str] = None

class ChatResponse(BaseModel):
    query: str
    response: str
    agents_used: List[str] = []
    response_data: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
