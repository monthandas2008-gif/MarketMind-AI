"""
Pydantic models for stock market data, quotes, movers, and index summaries.
"""

from typing import List, Dict, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field

class StockInfo(BaseModel):
    symbol: str
    company_name: str
    exchange: str = "NSE"
    sector: str = ""
    yfinance_symbol: str
    is_index: bool = False
    is_active: bool = True

class MarketDataPoint(BaseModel):
    symbol: str
    trade_date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None
    change_percent: Optional[float] = None
    prev_close: Optional[float] = None
    source: str = "yfinance"

class StockMover(BaseModel):
    symbol: str
    company_name: str = ""
    close: float
    change_percent: float
    volume: int = 0
    sector: str = ""
    signal: str = "neutral"

class BenchmarkIndex(BaseModel):
    symbol: str
    name: str
    close: float
    change_percent: float
    prev_close: Optional[float] = None

class SectorPerformance(BaseModel):
    sector: str
    change_percent: float
    leaders: List[str] = []
    status: str = "neutral"  # bullish, neutral, bearish

class MarketOverview(BaseModel):
    nifty_close: float
    nifty_change_percent: float
    benchmarks: Dict[str, BenchmarkIndex] = {}
    top_gainers: List[StockMover] = []
    top_losers: List[StockMover] = []
    advances: int = 0
    declines: int = 0
    sectors: List[SectorPerformance] = []
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

    @property
    def advances_count(self) -> int:
        return self.advances

    @property
    def declines_count(self) -> int:
        return self.declines
