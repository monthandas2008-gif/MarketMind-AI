"""
Seed the MarketMind stock universe into Supabase.

Usage:
    python scripts/seed_stocks.py

Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

STOCKS = [
    {
        "symbol": "NIFTY50",
        "company_name": "Nifty 50 Index",
        "exchange": "NSE",
        "sector": "Index",
        "yfinance_symbol": "^NSEI",
        "is_index": True,
    },
    {
        "symbol": "RELIANCE",
        "company_name": "Reliance Industries Ltd",
        "exchange": "NSE",
        "sector": "Energy",
        "yfinance_symbol": "RELIANCE.NS",
        "is_index": False,
    },
    {
        "symbol": "TCS",
        "company_name": "Tata Consultancy Services Ltd",
        "exchange": "NSE",
        "sector": "IT",
        "yfinance_symbol": "TCS.NS",
        "is_index": False,
    },
    {
        "symbol": "INFY",
        "company_name": "Infosys Ltd",
        "exchange": "NSE",
        "sector": "IT",
        "yfinance_symbol": "INFY.NS",
        "is_index": False,
    },
    {
        "symbol": "ICICIBANK",
        "company_name": "ICICI Bank Ltd",
        "exchange": "NSE",
        "sector": "Banking",
        "yfinance_symbol": "ICICIBANK.NS",
        "is_index": False,
    },
    {
        "symbol": "ITC",
        "company_name": "ITC Ltd",
        "exchange": "NSE",
        "sector": "FMCG",
        "yfinance_symbol": "ITC.NS",
        "is_index": False,
    },
]


def main():
    """Seed stocks into Supabase."""
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

        from supabase import create_client
        
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        
        if not url or not key:
            print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env")
            sys.exit(1)
        
        client = create_client(url, key)
        
        for stock in STOCKS:
            result = client.table("stocks").upsert(stock, on_conflict="symbol").execute()
            print(f"  ✓ {stock['symbol']} — {stock['company_name']}")
        
        print(f"\n✅ Seeded {len(STOCKS)} stocks successfully!")
        
    except ImportError:
        print("ERROR: Install dependencies first: pip install supabase python-dotenv")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
