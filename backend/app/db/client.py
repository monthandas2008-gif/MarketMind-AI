"""
Database client for MarketMind.
Supports Supabase PostgreSQL with an automatic SQLite fallback when credentials are not yet set.
"""

import os
import uuid
import json
import math
import secrets
import sqlite3
import logging
from typing import Any, Dict, List, Optional
from datetime import date, datetime

logger = logging.getLogger(__name__)

class DatabaseClient:
    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        try:
            from app.config import settings
            cfg_url = settings.supabase_url
            cfg_key = settings.supabase_service_key or settings.supabase_anon_key
        except Exception:
            cfg_url = ""
            cfg_key = ""

        self.url = url or cfg_url or os.getenv("SUPABASE_URL", "")
        self.key = key or cfg_key or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
        self.use_supabase = bool(self.url and self.key and not self.url.startswith("your_"))
        self.supabase = None
        self.local_db_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "marketmind_local.db")
        )

        # Always initialize local SQLite database so local schema and fallback tables exist
        self._init_local_db()

        if self.use_supabase:
            try:
                from supabase import create_client
                self.supabase = create_client(self.url, self.key)
                # Test query to verify tables exist
                self.supabase.table("stocks").select("id").limit(1).execute()
                logger.info("Connected to Supabase PostgreSQL.")
            except Exception as e:
                logger.warning(f"Supabase configured, but schema check failed: {e}. Falling back to local SQLite database.")
                self.use_supabase = False
        else:
            logger.info("Supabase credentials not configured. Using local SQLite database.")

    def _init_local_db(self):
        """Initializes local SQLite tables mirroring the Supabase schema."""
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()

        cursor.executescript("""
        CREATE TABLE IF NOT EXISTS stocks (
            id TEXT PRIMARY KEY,
            symbol TEXT UNIQUE NOT NULL,
            company_name TEXT NOT NULL,
            exchange TEXT DEFAULT 'NSE',
            sector TEXT,
            yfinance_symbol TEXT NOT NULL,
            is_index BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS market_data (
            id TEXT PRIMARY KEY,
            symbol TEXT NOT NULL,
            trade_date TEXT NOT NULL,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            change_percent REAL,
            prev_close REAL,
            source TEXT DEFAULT 'yfinance',
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(symbol, trade_date)
        );

        CREATE TABLE IF NOT EXISTS news (
            id TEXT PRIMARY KEY,
            url_hash TEXT UNIQUE NOT NULL,
            symbol TEXT,
            headline TEXT NOT NULL,
            summary TEXT,
            source_name TEXT,
            source_url TEXT NOT NULL,
            published_at TEXT,
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_processed BOOLEAN DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS agent_analysis (
            id TEXT PRIMARY KEY,
            symbol TEXT NOT NULL,
            analysis_date TEXT NOT NULL,
            analysis_type TEXT NOT NULL,
            technical_summary TEXT,
            technical_signal TEXT,
            technical_indicators TEXT,
            news_summary TEXT,
            news_sentiment TEXT,
            news_sources TEXT,
            anomaly_detected BOOLEAN DEFAULT 0,
            anomaly_summary TEXT,
            anomaly_metrics TEXT,
            synthesis TEXT,
            evidence_strength TEXT,
            uncertainty_note TEXT,
            key_factors TEXT,
            raw_payload TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(symbol, analysis_date, analysis_type)
        );

        CREATE TABLE IF NOT EXISTS daily_reports (
            id TEXT PRIMARY KEY,
            report_date TEXT UNIQUE NOT NULL,
            market_summary TEXT NOT NULL,
            nifty_close REAL,
            nifty_change_percent REAL,
            top_gainers TEXT,
            top_losers TEXT,
            unusual_activity TEXT,
            technical_intelligence TEXT,
            news_intelligence TEXT,
            anomalies TEXT,
            ai_synthesis TEXT,
            evidence_strength TEXT,
            sources TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chat_queries (
            id TEXT PRIMARY KEY,
            user_query TEXT NOT NULL,
            parsed_intent TEXT,
            response TEXT NOT NULL,
            response_data TEXT,
            agents_used TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS instruments (
            id TEXT PRIMARY KEY,
            symbol TEXT UNIQUE NOT NULL,
            company_name TEXT NOT NULL,
            exchange TEXT DEFAULT 'NSE',
            isin TEXT,
            series TEXT DEFAULT 'EQ',
            provider_symbol TEXT NOT NULL,
            sector TEXT NOT NULL,
            industry TEXT,
            market_cap_category TEXT DEFAULT 'Large Cap',
            is_active BOOLEAN DEFAULT 1,
            is_supported BOOLEAN DEFAULT 1,
            aliases TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_tracked_stocks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            instrument_id TEXT,
            is_active BOOLEAN DEFAULT 1,
            priority INTEGER DEFAULT 1,
            custom_group TEXT DEFAULT 'Default',
            report_enabled BOOLEAN DEFAULT 1,
            alert_enabled BOOLEAN DEFAULT 1,
            added_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, symbol)
        );

        CREATE TABLE IF NOT EXISTS user_daily_reports (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            report_date TEXT NOT NULL,
            stocks_snapshot TEXT NOT NULL,
            market_summary TEXT NOT NULL,
            nifty_close REAL,
            nifty_change_percent REAL,
            biggest_movers TEXT,
            technical_developments TEXT,
            news_intelligence TEXT,
            unusual_activity TEXT,
            cross_stock_insights TEXT,
            lead_synthesis TEXT,
            evidence_strength TEXT DEFAULT 'moderate',
            sources TEXT,
            data_freshness TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, report_date)
        );

        CREATE TABLE IF NOT EXISTS user_api_keys (
            id TEXT PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            encrypted_key TEXT NOT NULL,
            provider TEXT DEFAULT 'gemini',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'analyst',
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Seed initial stocks in local SQLite
        cursor.execute("SELECT COUNT(*) FROM stocks")
        if cursor.fetchone()[0] == 0:
            initial_stocks = [
                ("1", "NIFTY50", "Nifty 50 Index", "NSE", "Index", "^NSEI", 1),
                ("2", "RELIANCE", "Reliance Industries Ltd", "NSE", "Energy", "RELIANCE.NS", 0),
                ("3", "TCS", "Tata Consultancy Services Ltd", "NSE", "IT", "TCS.NS", 0),
                ("4", "INFY", "Infosys Ltd", "NSE", "IT", "INFY.NS", 0),
                ("5", "ICICIBANK", "ICICI Bank Ltd", "NSE", "Banking", "ICICIBANK.NS", 0),
                ("6", "ITC", "ITC Ltd", "NSE", "FMCG", "ITC.NS", 0),
            ]
            cursor.executemany(
                "INSERT OR IGNORE INTO stocks (id, symbol, company_name, exchange, sector, yfinance_symbol, is_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
                initial_stocks
            )

        # Seed instruments table from SEED_INSTRUMENTS
        try:
            from app.services.instrument_master import SEED_INSTRUMENTS
            cursor.execute("SELECT COUNT(*) FROM instruments")
            if cursor.fetchone()[0] == 0:
                inst_rows = []
                for s in SEED_INSTRUMENTS:
                    inst_rows.append((
                        f"NSE_{s['symbol']}",
                        s['symbol'],
                        s['company_name'],
                        s.get('exchange', 'NSE'),
                        s.get('isin', ''),
                        s.get('series', 'EQ'),
                        s['provider_symbol'],
                        s['sector'],
                        s.get('industry', ''),
                        s.get('market_cap_category', 'Large Cap'),
                        1,
                        1,
                        json.dumps(s.get('aliases', []))
                    ))
                cursor.executemany("""
                    INSERT OR IGNORE INTO instruments (
                        id, symbol, company_name, exchange, isin, series, provider_symbol,
                        sector, industry, market_cap_category, is_active, is_supported, aliases
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, inst_rows)
        except Exception as e:
            logger.warning(f"Could not seed instruments table: {e}")

        # Seed or update master admin user (monthandas2008@gmail.com)
        try:
            from app.services.auth_service import hash_password
            admin_email = "monthandas2008@gmail.com"
            cursor.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
            existing_admin = cursor.fetchone()
            if not existing_admin:
                h, s = hash_password("Manthan@69")
                cursor.execute("""
                    INSERT INTO users (id, email, password_hash, salt, name, role, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, ("usr_admin_manthan", admin_email, h, s, "Manthan Das (Admin)", "admin", "approved"))
                logger.info("Master Admin account seeded: monthandas2008@gmail.com")
        except Exception as e:
            logger.warning(f"Could not seed admin user: {e}")

        # Seed default tracking for master admin
        try:
            default_users = ["monthandas2008@gmail.com", "default_user"]
            default_symbols = ["RELIANCE", "TCS", "INFY", "ICICIBANK", "ITC"]
            for u in default_users:
                for sym in default_symbols:
                    cursor.execute("""
                        INSERT OR IGNORE INTO user_tracked_stocks (id, user_id, symbol, instrument_id)
                        VALUES (?, ?, ?, ?)
                    """, (f"{u}_{sym}", u, sym, f"NSE_{sym}"))
        except Exception as e:
            logger.warning(f"Could not seed default user tracking: {e}")

        # Migrate existing tables if needed
        try:
            cursor.execute("ALTER TABLE agent_analysis ADD COLUMN raw_payload TEXT")
        except Exception:
            pass

        conn.commit()
        conn.close()

    # =========================================================
    # STOCKS
    # =========================================================
    async def get_stocks(self, active_only: bool = True) -> List[Dict[str, Any]]:
        if self.use_supabase:
            query = self.supabase.table("stocks").select("*")
            if active_only:
                query = query.eq("is_active", True)
            res = query.execute()
            return res.data or []
        else:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM stocks WHERE is_active = 1" if active_only else "SELECT * FROM stocks")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return rows

    # =========================================================
    # INSTRUMENTS & USER TRACKING
    # =========================================================
    async def get_instruments(self, sector: Optional[str] = None, search: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Returns verified instruments matching optional sector or search filters."""
        if self.use_supabase:
            try:
                query = self.supabase.table("instruments").select("*").eq("is_active", True)
                if sector and sector.upper() != "ALL":
                    query = query.ilike("sector", f"%{sector}%")
                if search:
                    query = query.or_(f"symbol.ilike.%{search}%,company_name.ilike.%{search}%")
                res = query.limit(limit).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                logger.warning(f"Supabase get_instruments failed ({e}); falling back to local SQLite.")

        conn = sqlite3.connect(self.local_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        sql = "SELECT * FROM instruments WHERE is_active = 1"
        params = []
        if sector and sector.upper() != "ALL":
            sql += " AND UPPER(sector) = ?"
            params.append(sector.upper())
        if search:
            sql += " AND (UPPER(symbol) LIKE ? OR UPPER(company_name) LIKE ? OR UPPER(aliases) LIKE ?)"
            search_param = f"%{search.upper()}%"
            params.extend([search_param, search_param, search_param])
        sql += " ORDER BY symbol ASC LIMIT ?"
        params.append(limit)
        cursor.execute(sql, params)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        for r in rows:
            if r.get("aliases") and isinstance(r["aliases"], str):
                try:
                    r["aliases"] = json.loads(r["aliases"])
                except Exception:
                    r["aliases"] = []
        return rows

    async def get_user_tracked_stocks(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns all actively tracked stocks for a specific user with instrument metadata."""
        if self.use_supabase:
            try:
                res = self.supabase.table("user_tracked_stocks").select("*, instruments(*)").eq("user_id", user_id).eq("is_active", True).execute()
                if res.data is not None:
                    data = []
                    for item in res.data:
                        inst = item.get("instruments") or {}
                        data.append({
                            "id": item.get("id"),
                            "user_id": item.get("user_id"),
                            "symbol": item.get("symbol"),
                            "company_name": inst.get("company_name", item.get("symbol")),
                            "sector": inst.get("sector", "Equities"),
                            "priority": item.get("priority", 1),
                            "custom_group": item.get("custom_group", "Default"),
                            "report_enabled": bool(item.get("report_enabled", True)),
                            "added_at": item.get("added_at"),
                            "updated_at": item.get("updated_at"),
                        })
                    return data
            except Exception as e:
                logger.warning(f"Supabase get_user_tracked_stocks failed ({e}); falling back to local SQLite.")

        conn = sqlite3.connect(self.local_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT uts.id, uts.user_id, uts.symbol, uts.priority, uts.custom_group, uts.report_enabled,
                   uts.added_at, uts.updated_at, inst.company_name, inst.sector
            FROM user_tracked_stocks uts
            LEFT JOIN instruments inst ON uts.symbol = inst.symbol
            WHERE uts.user_id = ? AND uts.is_active = 1
            ORDER BY uts.added_at DESC
        """, (user_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    async def track_stock(
        self,
        user_id: str,
        symbol: str,
        instrument_id: Optional[str] = None,
        priority: int = 1,
        custom_group: str = "Default",
        report_enabled: bool = True,
        alert_enabled: bool = True,
        **kwargs
    ) -> bool:
        """Adds or reactivates a stock in the user's tracking universe."""
        sym_clean = symbol.upper().strip()
        tracking_id = f"{user_id}_{sym_clean}"
        inst_id = instrument_id or f"NSE_{sym_clean}"
        now = datetime.now().isoformat()
        
        # Always maintain local SQLite
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_tracked_stocks (id, user_id, symbol, instrument_id, is_active, priority, custom_group, report_enabled, alert_enabled, added_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, symbol) DO UPDATE SET
                is_active = 1,
                priority = excluded.priority,
                custom_group = excluded.custom_group,
                report_enabled = excluded.report_enabled,
                alert_enabled = excluded.alert_enabled,
                updated_at = excluded.updated_at
        """, (tracking_id, user_id, sym_clean, inst_id, priority, custom_group, int(report_enabled), int(alert_enabled), now, now))
        conn.commit()
        conn.close()

        if self.use_supabase:
            try:
                payload = {
                    "id": tracking_id,
                    "user_id": user_id,
                    "symbol": sym_clean,
                    "instrument_id": inst_id,
                    "is_active": True,
                    "priority": priority,
                    "custom_group": custom_group,
                    "report_enabled": report_enabled,
                    "alert_enabled": alert_enabled,
                    "updated_at": now
                }
                self.supabase.table("user_tracked_stocks").upsert(payload, on_conflict="user_id,symbol").execute()
            except Exception as e:
                logger.warning(f"Supabase track_stock failed ({e}); recorded in SQLite.")
        return True

    async def untrack_stock(self, user_id: str, symbol: str) -> bool:
        """Deactivates a stock in the user's tracking universe without deleting global instrument data."""
        sym_clean = symbol.upper().strip()
        now = datetime.now().isoformat()
        
        # Always update local SQLite
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_tracked_stocks
            SET is_active = 0, updated_at = ?
            WHERE user_id = ? AND symbol = ?
        """, (now, user_id, sym_clean))
        conn.commit()
        conn.close()

        if self.use_supabase:
            try:
                self.supabase.table("user_tracked_stocks").update({"is_active": False, "updated_at": now}).eq("user_id", user_id).eq("symbol", sym_clean).execute()
            except Exception as e:
                logger.warning(f"Supabase untrack_stock failed ({e}); updated in SQLite.")
        return True

    async def save_user_daily_report(self, report_data: Dict[str, Any]) -> bool:
        """Persists a personalized user daily report including the tracked stock universe snapshot."""
        u_id = report_data["user_id"]
        r_date = report_data["report_date"]
        rep_id = f"UR_{u_id}_{r_date}"
        now = datetime.now().isoformat()
        
        snapshot = json.dumps(report_data.get("stocks_snapshot", []))
        movers = json.dumps(report_data.get("biggest_movers", []), default=str)
        tech_dev = json.dumps(report_data.get("technical_developments", {}), default=str)
        news_intel = json.dumps(report_data.get("news_intelligence", {}), default=str)
        unusual = json.dumps(report_data.get("unusual_activity", []), default=str)
        cross_stock = json.dumps(report_data.get("cross_stock_insights", []), default=str)
        sources = json.dumps(report_data.get("sources", []), default=str)

        # Always save to local SQLite
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_daily_reports (
                id, user_id, report_date, stocks_snapshot, market_summary,
                nifty_close, nifty_change_percent, biggest_movers,
                technical_developments, news_intelligence, unusual_activity,
                cross_stock_insights, lead_synthesis, evidence_strength,
                sources, data_freshness, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, report_date) DO UPDATE SET
                stocks_snapshot = excluded.stocks_snapshot,
                market_summary = excluded.market_summary,
                nifty_close = excluded.nifty_close,
                nifty_change_percent = excluded.nifty_change_percent,
                biggest_movers = excluded.biggest_movers,
                technical_developments = excluded.technical_developments,
                news_intelligence = excluded.news_intelligence,
                unusual_activity = excluded.unusual_activity,
                cross_stock_insights = excluded.cross_stock_insights,
                lead_synthesis = excluded.lead_synthesis,
                evidence_strength = excluded.evidence_strength,
                sources = excluded.sources,
                data_freshness = excluded.data_freshness,
                created_at = excluded.created_at
        """, (
            rep_id, u_id, r_date, snapshot, report_data.get("market_summary", ""),
            report_data.get("nifty_close", 0.0), report_data.get("nifty_change_percent", 0.0),
            movers, tech_dev, news_intel, unusual, cross_stock,
            report_data.get("lead_synthesis", ""), report_data.get("evidence_strength", "moderate"),
            sources, report_data.get("data_freshness", "LATEST AVAILABLE"), now
        ))
        conn.commit()
        conn.close()

        if self.use_supabase:
            try:
                payload = {
                    "id": rep_id,
                    "user_id": u_id,
                    "report_date": r_date,
                    "stocks_snapshot": snapshot,
                    "market_summary": report_data.get("market_summary", ""),
                    "nifty_close": report_data.get("nifty_close", 0.0),
                    "nifty_change_percent": report_data.get("nifty_change_percent", 0.0),
                    "biggest_movers": movers,
                    "technical_developments": tech_dev,
                    "news_intelligence": news_intel,
                    "unusual_activity": unusual,
                    "cross_stock_insights": cross_stock,
                    "lead_synthesis": report_data.get("lead_synthesis", ""),
                    "evidence_strength": report_data.get("evidence_strength", "moderate"),
                    "sources": sources,
                    "data_freshness": report_data.get("data_freshness", "LATEST AVAILABLE"),
                    "created_at": now
                }
                self.supabase.table("user_daily_reports").upsert(payload, on_conflict="user_id,report_date").execute()
            except Exception as e:
                logger.warning(f"Supabase save_user_daily_report failed ({e}); preserved in SQLite.")

        return True

    def _parse_user_report_json(self, rep: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not rep:
            return None
        for col in ["stocks_snapshot", "biggest_movers", "technical_developments", "news_intelligence", "unusual_activity", "cross_stock_insights", "sources"]:
            if rep.get(col) and isinstance(rep[col], str):
                try:
                    rep[col] = json.loads(rep[col])
                except Exception:
                    pass
        return rep

    async def get_user_daily_reports(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Returns historical personalized reports for a user."""
        if self.use_supabase:
            try:
                res = self.supabase.table("user_daily_reports").select("*").eq("user_id", user_id).order("report_date", desc=True).limit(limit).execute()
                if res.data is not None:
                    return [self._parse_user_report_json(r) for r in res.data]
            except Exception as e:
                logger.warning(f"Supabase get_user_daily_reports failed ({e}); falling back to local SQLite.")

        conn = sqlite3.connect(self.local_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM user_daily_reports
            WHERE user_id = ?
            ORDER BY report_date DESC
            LIMIT ?
        """, (user_id, limit))
        rows = [self._parse_user_report_json(dict(r)) for r in cursor.fetchall()]
        conn.close()
        return rows

    async def get_user_daily_report_by_date(self, user_id: str, report_date: str) -> Optional[Dict[str, Any]]:
        """Returns a user's report for a specific date."""
        if self.use_supabase:
            try:
                res = self.supabase.table("user_daily_reports").select("*").eq("user_id", user_id).eq("report_date", report_date).limit(1).execute()
                if res.data:
                    return self._parse_user_report_json(res.data[0])
            except Exception as e:
                logger.warning(f"Supabase get_user_daily_report_by_date failed ({e}); falling back to local SQLite.")

        conn = sqlite3.connect(self.local_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_daily_reports WHERE user_id = ? AND report_date = ? LIMIT 1", (user_id, report_date))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        return self._parse_user_report_json(dict(row))

    # =========================================================
    # MARKET DATA
    # =========================================================
    async def save_market_data(self, records: List[Dict[str, Any]]) -> bool:
        if not records:
            return True

        def _clean_val(v):
            if v is None:
                return None
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                return None
            return v

        clean_records = [
            {k: _clean_val(v) for k, v in r.items()}
            for r in records
        ]

        if self.use_supabase:
            try:
                self.supabase.table("market_data").upsert(clean_records, on_conflict="symbol,trade_date").execute()
                return True
            except Exception as e:
                logger.warning(f"Supabase upsert market_data failed: {e}")
                return False
        else:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            for r in clean_records:
                cursor.execute("""
                    INSERT INTO market_data (id, symbol, trade_date, open, high, low, close, volume, change_percent, prev_close, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(symbol, trade_date) DO UPDATE SET
                        open=excluded.open,
                        high=excluded.high,
                        low=excluded.low,
                        close=excluded.close,
                        volume=excluded.volume,
                        change_percent=excluded.change_percent,
                        prev_close=excluded.prev_close
                """, (
                    f"{r['symbol']}_{r['trade_date']}",
                    r["symbol"],
                    str(r["trade_date"]),
                    r.get("open"),
                    r.get("high"),
                    r.get("low"),
                    r.get("close"),
                    r.get("volume"),
                    r.get("change_percent"),
                    r.get("prev_close"),
                    r.get("source", "yfinance")
                ))
            conn.commit()
            conn.close()
            return True

    async def get_market_data(self, symbol: str, limit: int = 60) -> List[Dict[str, Any]]:
        if self.use_supabase:
            res = (
                self.supabase.table("market_data")
                .select("*")
                .eq("symbol", symbol)
                .order("trade_date", desc=True)
                .limit(limit)
                .execute()
            )
            data = res.data or []
            data.reverse()
            return data
        else:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM market_data WHERE symbol = ? ORDER BY trade_date DESC LIMIT ?",
                (symbol, limit)
            )
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            rows.reverse()
            return rows

    # =========================================================
    # NEWS & DEDUPLICATION
    # =========================================================
    async def is_news_seen(self, url_hash: str) -> bool:
        if self.use_supabase:
            res = self.supabase.table("news").select("id").eq("url_hash", url_hash).limit(1).execute()
            return len(res.data or []) > 0
        else:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM news WHERE url_hash = ? LIMIT 1", (url_hash,))
            found = cursor.fetchone() is not None
            conn.close()
            return found

    async def save_news(self, articles: List[Dict[str, Any]]) -> int:
        saved_count = 0
        for article in articles:
            url_hash = article["url_hash"]
            if await self.is_news_seen(url_hash):
                continue

            if self.use_supabase:
                self.supabase.table("news").insert(article).execute()
            else:
                conn = sqlite3.connect(self.local_db_path)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO news (id, url_hash, symbol, headline, summary, source_name, source_url, published_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    url_hash,
                    url_hash,
                    article.get("symbol"),
                    article["headline"],
                    article.get("summary", ""),
                    article.get("source_name", ""),
                    article["source_url"],
                    str(article.get("published_at", ""))
                ))
                conn.commit()
                conn.close()
            saved_count += 1
        return saved_count

    async def get_recent_news(self, symbol: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        if self.use_supabase:
            query = self.supabase.table("news").select("*").order("published_at", desc=True).limit(limit)
            if symbol:
                query = query.eq("symbol", symbol)
            res = query.execute()
            return res.data or []
        else:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if symbol:
                cursor.execute(
                    "SELECT * FROM news WHERE symbol = ? ORDER BY published_at DESC LIMIT ?",
                    (symbol, limit)
                )
            else:
                cursor.execute("SELECT * FROM news ORDER BY published_at DESC LIMIT ?", (limit,))
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return rows

    # =========================================================
    # AGENT ANALYSIS
    # =========================================================
    async def save_agent_analysis(self, analysis_data: Dict[str, Any]) -> bool:
        # Always save complete record to local SQLite (including raw_payload)
        conn = sqlite3.connect(self.local_db_path)
        cursor = conn.cursor()
        raw_payload_str = json.dumps(analysis_data.get("raw_payload")) if analysis_data.get("raw_payload") else None
        cursor.execute("""
            INSERT INTO agent_analysis (
                id, symbol, analysis_date, analysis_type,
                technical_summary, technical_signal, technical_indicators,
                news_summary, news_sentiment, news_sources,
                anomaly_detected, anomaly_summary, anomaly_metrics,
                synthesis, evidence_strength, uncertainty_note, key_factors, raw_payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(symbol, analysis_date, analysis_type) DO UPDATE SET
                technical_summary=excluded.technical_summary,
                technical_signal=excluded.technical_signal,
                technical_indicators=excluded.technical_indicators,
                news_summary=excluded.news_summary,
                news_sentiment=excluded.news_sentiment,
                news_sources=excluded.news_sources,
                anomaly_detected=excluded.anomaly_detected,
                anomaly_summary=excluded.anomaly_summary,
                anomaly_metrics=excluded.anomaly_metrics,
                synthesis=excluded.synthesis,
                evidence_strength=excluded.evidence_strength,
                uncertainty_note=excluded.uncertainty_note,
                key_factors=excluded.key_factors,
                raw_payload=excluded.raw_payload
        """, (
            f"{analysis_data['symbol']}_{analysis_data['analysis_date']}_{analysis_data.get('analysis_type', 'daily_auto')}",
            analysis_data["symbol"],
            str(analysis_data["analysis_date"]),
            analysis_data.get("analysis_type", "daily_auto"),
            analysis_data.get("technical_summary"),
            analysis_data.get("technical_signal"),
            json.dumps(analysis_data.get("technical_indicators")) if isinstance(analysis_data.get("technical_indicators"), (dict, list)) else analysis_data.get("technical_indicators"),
            analysis_data.get("news_summary"),
            analysis_data.get("news_sentiment"),
            json.dumps(analysis_data.get("news_sources")) if isinstance(analysis_data.get("news_sources"), (dict, list)) else analysis_data.get("news_sources"),
            1 if analysis_data.get("anomaly_detected") else 0,
            analysis_data.get("anomaly_summary"),
            json.dumps(analysis_data.get("anomaly_metrics")) if isinstance(analysis_data.get("anomaly_metrics"), (dict, list)) else analysis_data.get("anomaly_metrics"),
            analysis_data.get("synthesis"),
            analysis_data.get("evidence_strength"),
            analysis_data.get("uncertainty_note"),
            json.dumps(analysis_data.get("key_factors")) if isinstance(analysis_data.get("key_factors"), (dict, list)) else analysis_data.get("key_factors"),
            raw_payload_str
        ))
        conn.commit()
        conn.close()

        if self.use_supabase:
            try:
                supa_payload = dict(analysis_data)
                supa_payload.pop("raw_payload", None)
                self.supabase.table("agent_analysis").upsert(
                    supa_payload, on_conflict="symbol,analysis_date,analysis_type"
                ).execute()
            except Exception as e:
                logger.warning(f"Supabase upsert agent_analysis skipped: {e}")

        return True

    async def get_latest_analysis(self, symbol: str) -> Optional[Dict[str, Any]]:
        # Check SQLite first to see if full raw_payload is cached locally
        conn = sqlite3.connect(self.local_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM agent_analysis WHERE symbol = ? ORDER BY analysis_date DESC LIMIT 1",
            (symbol,)
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            res = dict(row)
            if res.get("raw_payload") and isinstance(res["raw_payload"], str):
                try:
                    payload = json.loads(res["raw_payload"])
                    if isinstance(payload, dict):
                        return payload
                except Exception:
                    pass
            for json_col in ["technical_indicators", "news_sources", "anomaly_metrics", "key_factors"]:
                if res.get(json_col) and isinstance(res[json_col], str):
                    try:
                        res[json_col] = json.loads(res[json_col])
                    except Exception:
                        pass
            return res

        if self.use_supabase:
            try:
                res = (
                    self.supabase.table("agent_analysis")
                    .select("*")
                    .eq("symbol", symbol)
                    .order("analysis_date", desc=True)
                    .limit(1)
                    .execute()
                )
                return res.data[0] if res.data else None
            except Exception as e:
                logger.warning(f"Supabase get_latest_analysis failed: {e}")
                return None
        return None

    # =========================================================
    # DAILY REPORTS
    # =========================================================
    async def save_daily_report(self, report: Dict[str, Any]) -> bool:
        if self.use_supabase:
            self.supabase.table("daily_reports").upsert(report, on_conflict="report_date").execute()
            return True
        else:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO daily_reports (
                    id, report_date, market_summary, nifty_close, nifty_change_percent,
                    top_gainers, top_losers, unusual_activity,
                    technical_intelligence, news_intelligence, anomalies,
                    ai_synthesis, evidence_strength, sources
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(report_date) DO UPDATE SET
                    market_summary=excluded.market_summary,
                    nifty_close=excluded.nifty_close,
                    nifty_change_percent=excluded.nifty_change_percent,
                    top_gainers=excluded.top_gainers,
                    top_losers=excluded.top_losers,
                    unusual_activity=excluded.unusual_activity,
                    technical_intelligence=excluded.technical_intelligence,
                    news_intelligence=excluded.news_intelligence,
                    anomalies=excluded.anomalies,
                    ai_synthesis=excluded.ai_synthesis,
                    evidence_strength=excluded.evidence_strength,
                    sources=excluded.sources
            """, (
                str(report["report_date"]),
                str(report["report_date"]),
                report.get("market_summary", ""),
                report.get("nifty_close"),
                report.get("nifty_change_percent"),
                json.dumps(report.get("top_gainers", [])),
                json.dumps(report.get("top_losers", [])),
                json.dumps(report.get("unusual_activity", [])),
                report.get("technical_intelligence", ""),
                report.get("news_intelligence", ""),
                report.get("anomalies", ""),
                report.get("ai_synthesis", ""),
                report.get("evidence_strength", "moderate"),
                json.dumps(report.get("sources", []))
            ))
            conn.commit()
            conn.close()
            return True

    def _parse_report_json_columns(self, res: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not res:
            return None
        for json_col in ["top_gainers", "top_losers", "unusual_activity", "sources"]:
            if res.get(json_col) and isinstance(res[json_col], str):
                try:
                    res[json_col] = json.loads(res[json_col])
                except Exception:
                    pass
        return res

    async def get_latest_report(self) -> Optional[Dict[str, Any]]:
        if self.use_supabase:
            res = self.supabase.table("daily_reports").select("*").order("report_date", desc=True).limit(1).execute()
            report = res.data[0] if res.data else None
            return self._parse_report_json_columns(report)
        else:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT 1")
            row = cursor.fetchone()
            conn.close()
            if not row:
                return None
            return self._parse_report_json_columns(dict(row))

    async def get_report_by_date(self, report_date: str) -> Optional[Dict[str, Any]]:
        if self.use_supabase:
            res = self.supabase.table("daily_reports").select("*").eq("report_date", report_date).limit(1).execute()
            report = res.data[0] if res.data else None
            return self._parse_report_json_columns(report)
        else:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM daily_reports WHERE report_date = ? LIMIT 1", (report_date,))
            row = cursor.fetchone()
            conn.close()
            if not row:
                return None
            return self._parse_report_json_columns(dict(row))

    async def get_reports_list(self, limit: int = 30) -> List[Dict[str, Any]]:
        if self.use_supabase:
            res = self.supabase.table("daily_reports").select("report_date, market_summary, nifty_change_percent, created_at").order("report_date", desc=True).limit(limit).execute()
            return res.data or []
        else:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT report_date, market_summary, nifty_change_percent, created_at FROM daily_reports ORDER BY report_date DESC LIMIT ?", (limit,))
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return rows

    # =========================================================
    # CHAT QUERIES
    # =========================================================
    async def save_chat_query(self, query_data: Dict[str, Any]) -> bool:
        if self.use_supabase:
            self.supabase.table("chat_queries").insert(query_data).execute()
            return True
        else:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_queries (id, user_query, parsed_intent, response, response_data, agents_used)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                str(datetime.now().timestamp()),
                query_data["user_query"],
                json.dumps(query_data.get("parsed_intent", {}), default=str),
                query_data["response"],
                json.dumps(query_data.get("response_data", {}), default=str),
                json.dumps(query_data.get("agents_used", []), default=str)
            ))
            conn.commit()
            conn.close()
            return True

    # =========================================================
    # USER API KEYS (ENCRYPTED STORAGE)
    # =========================================================
    async def save_user_api_key(self, user_id: str, encrypted_key: str, provider: str = "gemini") -> bool:
        now_str = datetime.now().isoformat()
        if self.use_supabase:
            try:
                self.supabase.table("user_api_keys").upsert({
                    "user_id": user_id,
                    "encrypted_key": encrypted_key,
                    "provider": provider,
                    "updated_at": now_str
                }, on_conflict="user_id").execute()
                return True
            except Exception as e:
                logger.error(f"Error saving user API key in Supabase: {e}")
                return False
        else:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_api_keys (id, user_id, encrypted_key, provider, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    encrypted_key = excluded.encrypted_key,
                    updated_at = excluded.updated_at
            """, (
                f"key_{user_id}_{provider}",
                user_id,
                encrypted_key,
                provider,
                now_str,
                now_str
            ))
            conn.commit()
            conn.close()
            return True

    async def get_user_api_key(self, user_id: str, provider: str = "gemini") -> Optional[str]:
        if self.use_supabase:
            try:
                res = self.supabase.table("user_api_keys").select("encrypted_key").eq("user_id", user_id).eq("provider", provider).limit(1).execute()
                if res.data:
                    return res.data[0]["encrypted_key"]
                return None
            except Exception as e:
                logger.error(f"Error fetching user API key from Supabase: {e}")
                return None
        else:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT encrypted_key FROM user_api_keys WHERE user_id = ? AND provider = ? LIMIT 1", (user_id, provider))
            row = cursor.fetchone()
            conn.close()
            if row:
                return row["encrypted_key"]
            return None

    async def delete_user_api_key(self, user_id: str, provider: str = "gemini") -> bool:
        if self.use_supabase:
            try:
                self.supabase.table("user_api_keys").delete().eq("user_id", user_id).eq("provider", provider).execute()
                return True
            except Exception:
                return False
        else:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_api_keys WHERE user_id = ? AND provider = ?", (user_id, provider))
            conn.commit()
            conn.close()
            return True

    # =========================================================
    # USER AUTHENTICATION & ACCESS CONTROL
    # =========================================================
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.lower().strip()
        if self.use_supabase:
            try:
                res = self.supabase.table("users").select("*").eq("email", clean_email).limit(1).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase users query failed ({e}), falling back to SQLite.")

        try:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ? LIMIT 1", (clean_email,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching user from SQLite: {e}")
            return None

    async def create_user(
        self,
        email: str,
        password_hash: str,
        salt: str,
        name: str,
        role: str = "analyst",
        status: str = "pending"
    ) -> Optional[Dict[str, Any]]:
        clean_email = email.lower().strip()
        user_id = str(uuid.uuid4())
        now_str = datetime.now().isoformat()
        user_record = {
            "id": user_id,
            "email": clean_email,
            "password_hash": password_hash,
            "salt": salt,
            "name": name.strip(),
            "role": role,
            "status": status,
            "created_at": now_str,
            "updated_at": now_str
        }

        if self.use_supabase:
            try:
                res = self.supabase.table("users").insert(user_record).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase user insert failed ({e}), falling back to SQLite.")

        try:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, salt, name, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, clean_email, password_hash, salt, name.strip(), role, status, now_str, now_str
            ))
            conn.commit()
            conn.close()
            return user_record
        except Exception as e:
            logger.error(f"Error creating user in SQLite: {e}")
            return None

    async def get_pending_users(self) -> List[Dict[str, Any]]:
        if self.use_supabase:
            try:
                res = self.supabase.table("users").select("id, email, name, role, status, created_at").eq("status", "pending").order("created_at", desc=True).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                logger.warning(f"Supabase pending users query failed ({e}), falling back to SQLite.")

        try:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, name, role, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return rows
        except Exception as e:
            logger.error(f"Error fetching pending users from SQLite: {e}")
            return []

    async def get_all_users(self) -> List[Dict[str, Any]]:
        if self.use_supabase:
            try:
                res = self.supabase.table("users").select("id, email, name, role, status, created_at, updated_at").order("created_at", desc=True).execute()
                if res.data is not None:
                    return res.data
            except Exception as e:
                logger.warning(f"Supabase all users query failed ({e}), falling back to SQLite.")

        try:
            conn = sqlite3.connect(self.local_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, name, role, status, created_at, updated_at FROM users ORDER BY created_at DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return rows
        except Exception as e:
            logger.error(f"Error fetching all users from SQLite: {e}")
            return []

    async def update_user_status(self, email: str, status: str) -> bool:
        clean_email = email.lower().strip()
        now_str = datetime.now().isoformat()
        supabase_success = False
        if self.use_supabase:
            try:
                self.supabase.table("users").update({"status": status, "updated_at": now_str}).eq("email", clean_email).execute()
                supabase_success = True
            except Exception as e:
                logger.warning(f"Supabase user status update failed ({e}), updating local SQLite.")

        try:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET status = ?, updated_at = ? WHERE email = ?", (status, now_str, clean_email))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error updating user status in SQLite: {e}")
            return supabase_success

db = DatabaseClient()

