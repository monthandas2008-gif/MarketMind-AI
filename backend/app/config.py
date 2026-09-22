from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List, Dict

class MarketConfig(BaseSettings):
    stock_universe: List[str] = ["RELIANCE", "TCS", "INFY", "ICICIBANK", "ITC", "NIFTY50"]
    yfinance_symbol_mapping: Dict[str, str] = {
        "RELIANCE": "RELIANCE.NS",
        "TCS": "TCS.NS",
        "INFY": "INFY.NS",
        "ICICIBANK": "ICICIBANK.NS",
        "ITC": "ITC.NS",
        "NIFTY50": "^NSEI"
    }
    news_rss_feed_urls: List[str] = [
        "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "https://www.moneycontrol.com/rss/marketedge.xml"
    ]
    timezone: str = Field(default="Asia/Kolkata", alias="MARKET_TIMEZONE")
    significant_move_threshold: float = Field(default=2.0, alias="SIGNIFICANT_MOVE_THRESHOLD")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=('.env', 'venv/.env', '../backend/.env'), env_file_encoding='utf-8', extra='ignore')
    
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"
    
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    
    app_env: str = "development"
    app_port: int = 8000
    log_level: str = "INFO"
    
    market: MarketConfig = MarketConfig()

settings = Settings()
