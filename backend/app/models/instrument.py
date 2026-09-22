"""
Instrument and User Tracking Data Models for MarketMind.
Defines schemas for the centralized Indian Equity Instrument Master and user tracking relationships.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Instrument(BaseModel):
    """
    Centralized instrument model for Indian equities.
    Maintains verified exchange metadata, sector classification, and provider symbols.
    """
    instrument_id: str = Field(..., description="Unique internal identifier, e.g. 'NSE_TATAMOTORS'")
    symbol: str = Field(..., description="NSE trading ticker symbol, e.g. 'TATAMOTORS'")
    company_name: str = Field(..., description="Full legal company name")
    exchange: str = Field(default="NSE", description="Exchange: NSE or BSE")
    isin: Optional[str] = Field(default=None, description="International Securities Identification Number")
    series: str = Field(default="EQ", description="Equity trading series (typically 'EQ')")
    provider_symbol: str = Field(..., description="yfinance ticker symbol, e.g. 'TATAMOTORS.NS'")
    sector: str = Field(..., description="Primary economic sector (e.g. 'Auto', 'Banking', 'IT')")
    industry: str = Field(..., description="Specific industry classification")
    market_cap_category: str = Field(default="Large Cap", description="Large Cap, Mid Cap, Small Cap")
    is_active: bool = Field(default=True, description="Whether currently listed and actively traded")
    is_supported: bool = Field(default=True, description="Whether supported by MarketMind market data feed")
    aliases: List[str] = Field(default_factory=list, description="Common search keywords, abbreviations, and brand names")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @property
    def id(self) -> str:
        return self.instrument_id

class InstrumentSearchResult(BaseModel):
    """Search response payload for dynamic stock lookup."""
    symbol: str
    company_name: str
    exchange: str
    sector: str
    industry: str
    market_cap_category: str
    provider_symbol: str
    is_tracked: bool = False
    latest_close: Optional[float] = None
    change_percent: Optional[float] = None
    data_status: str = "LATEST AVAILABLE"

class UserTrackedStock(BaseModel):
    """User-specific tracking relation."""
    id: str
    user_id: str
    symbol: str
    instrument_id: Optional[str] = None
    company_name: Optional[str] = None
    sector: Optional[str] = None
    is_active: bool = True
    priority: int = 1
    custom_group: Optional[str] = "Default"
    report_enabled: bool = True
    alert_enabled: bool = True
    added_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class TrackStockRequest(BaseModel):
    """Payload to add a stock to the user's tracking universe."""
    symbol: str
    user_id: Optional[str] = "monthandas2008@gmail.com"
    priority: Optional[int] = 1
    custom_group: Optional[str] = "Default"
    report_enabled: Optional[bool] = True
    alert_enabled: Optional[bool] = True

class UntrackStockRequest(BaseModel):
    """Payload to remove a stock from the user's tracking universe."""
    user_id: str
    symbol: str
