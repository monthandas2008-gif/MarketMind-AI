"""
Pydantic models for daily market reports and historical summaries.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.market import StockMover

class DailyReport(BaseModel):
    report_date: str
    market_summary: str
    nifty_close: float
    nifty_change_percent: float
    top_gainers: List[StockMover] = []
    top_losers: List[StockMover] = []
    unusual_activity: List[Dict[str, Any]] = []
    technical_intelligence: str = ""
    news_intelligence: str = ""
    anomalies: str = ""
    ai_synthesis: str = ""
    evidence_strength: str = "moderate"
    sources: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class ReportSummary(BaseModel):
    report_date: str
    market_summary: str
    nifty_change_percent: float
    created_at: Optional[str] = None
