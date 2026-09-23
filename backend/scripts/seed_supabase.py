"""
Seeds instruments and default tracking into Supabase PostgreSQL database.
Run this script after applying the SQL migrations in Supabase SQL Editor.
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

load_dotenv(os.path.join(backend_dir, "venv", ".env"))
load_dotenv(os.path.join(backend_dir, ".env"))

from supabase import create_client
from app.services.instrument_master import SEED_INSTRUMENTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def seed_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        logger.error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing in .env")
        return

    logger.info(f"Connecting to Supabase at {url}...")
    sb = create_client(url, key)

    # 1. Check if instruments table exists
    try:
        res = sb.table("instruments").select("count", count="exact").execute()
        current_count = res.count or 0
        logger.info(f"Current instruments in Supabase: {current_count}")
    except Exception as e:
        logger.error(f"'instruments' table does not exist or error: {e}")
        logger.error("Please run the SQL migration in Supabase SQL Editor first!")
        return

    # 2. Seed instruments
    rows = []
    for item in SEED_INSTRUMENTS:
        rows.append({
            "symbol": item["symbol"].upper(),
            "company_name": item["company_name"],
            "exchange": item.get("exchange", "NSE"),
            "isin": item.get("isin"),
            "series": item.get("series", "EQ"),
            "provider_symbol": item["provider_symbol"],
            "sector": item["sector"],
            "industry": item.get("industry"),
            "market_cap_category": item.get("market_cap_category", "Large Cap"),
            "is_active": True,
            "is_supported": True,
            "aliases": item.get("aliases", [])
        })

    logger.info(f"Upserting {len(rows)} verified Indian instruments into Supabase...")
    sb.table("instruments").upsert(rows, on_conflict="symbol").execute()
    logger.info(" Instruments seeded successfully!")

    # 3. Seed default user tracking for Master Admin
    try:
        admin_email = "monthandas2008@gmail.com"
        default_symbols = ["RELIANCE", "TCS", "INFY", "ICICIBANK", "ITC"]
        tracked_rows = []
        for sym in default_symbols:
            tracked_rows.append({
                "user_id": admin_email,
                "symbol": sym,
                "instrument_id": f"NSE_{sym}",
                "is_active": True,
                "priority": 1,
                "custom_group": "Default",
                "report_enabled": True,
                "alert_enabled": True
            })
        sb.table("user_tracked_stocks").upsert(tracked_rows, on_conflict="user_id,symbol").execute()
        logger.info(f" Seeded default tracking ({default_symbols}) for {admin_email}!")
    except Exception as e:
        logger.warning(f"Note on user tracking: {e}")

    logger.info("Supabase seeding completed successfully!")

if __name__ == "__main__":
    seed_supabase()
