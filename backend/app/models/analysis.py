from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime
from app.models.market import MarketDataPoint

class Evidence(BaseModel):
    claim: str
    source: str
    source_url: Optional[str] = None
    data_point: Optional[dict] = None

class AgentResult(BaseModel):
    agent_name: str
    symbol: str
    findings: str
    signal: Literal['bullish', 'neutral', 'bearish']
    confidence: Literal['high', 'moderate', 'low']
    evidence: List[Evidence]
    timestamp: datetime

    @property
    def indicators(self) -> dict:
        for ev in self.evidence:
            if ev.data_point:
                return ev.data_point
        return {}

    @property
    def sentiment(self) -> str:
        return self.signal

class StockAnalysis(BaseModel):
    symbol: str
    technical: Optional[AgentResult] = None
    news: Optional[AgentResult] = None
    anomaly: Optional[AgentResult] = None
    synthesis: Optional[AgentResult] = None
    analysis_date: datetime
