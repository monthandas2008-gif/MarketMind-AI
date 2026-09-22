"""
High-level query helpers for MarketMind agents and API routes.
"""

from typing import Any, Dict, List, Optional
from datetime import date
from app.db.client import db
from app.models.market import StockInfo, MarketDataPoint

async def get_active_stocks() -> List[StockInfo]:
    raw_stocks = await db.get_stocks(active_only=True)
    return [
        StockInfo(
            symbol=s["symbol"],
            company_name=s["company_name"],
            exchange=s.get("exchange", "NSE"),
            sector=s.get("sector") or "",
            yfinance_symbol=s["yfinance_symbol"]
        )
        for s in raw_stocks
    ]

async def get_historical_market_data(symbol: str, limit: int = 60) -> List[MarketDataPoint]:
    rows = await db.get_market_data(symbol=symbol, limit=limit)
    return [
        MarketDataPoint(
            symbol=r["symbol"],
            trade_date=str(r["trade_date"]),
            open=float(r["open"]) if r.get("open") is not None else None,
            high=float(r["high"]) if r.get("high") is not None else None,
            low=float(r["low"]) if r.get("low") is not None else None,
            close=float(r["close"]) if r.get("close") is not None else None,
            volume=int(r["volume"]) if r.get("volume") is not None else None,
            change_percent=float(r["change_percent"]) if r.get("change_percent") is not None else None,
            prev_close=float(r["prev_close"]) if r.get("prev_close") is not None else None,
            source=r.get("source", "yfinance")
        )
        for r in rows
    ]

async def get_latest_stock_analysis(symbol: str) -> Optional[Dict[str, Any]]:
    return await db.get_latest_analysis(symbol)

async def get_latest_daily_report() -> Optional[Dict[str, Any]]:
    return await db.get_latest_report()

async def get_daily_report_by_date(report_date: str) -> Optional[Dict[str, Any]]:
    return await db.get_report_by_date(report_date)

async def get_daily_reports_list(limit: int = 30) -> List[Dict[str, Any]]:
    return await db.get_reports_list(limit=limit)
