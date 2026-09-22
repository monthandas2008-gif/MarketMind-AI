"""
NewsService for MarketMind.
Fetches Indian stock market news from Google News RSS and direct financial feeds (Economic Times, Moneycontrol).
Features SHA-256 URL deduplication, HTML stripping, clean attribution, and database persistence.
"""

import asyncio
import hashlib
import html
import logging
import re
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Optional
import feedparser
from dateutil import parser as date_parser

from app.config import settings, MarketConfig
from app.services.instrument_master import instrument_master
from app.db.client import db

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self, config: Optional[MarketConfig] = None):
        self.config = config or settings.market

    def _hash_url(self, url: str) -> str:
        """Computes SHA-256 hash of a URL for deduplication."""
        return hashlib.sha256(url.strip().encode("utf-8")).hexdigest()

    def _clean_html(self, raw_text: str) -> str:
        """Strips HTML tags and unescapes HTML entities."""
        if not raw_text:
            return ""
        clean = re.sub(r"<[^>]+>", " ", raw_text)
        clean = html.unescape(clean)
        return " ".join(clean.split()).strip()

    def _parse_pub_date(self, entry: Any) -> str:
        """Extracts and standardizes publication timestamp to ISO format."""
        pub_str = getattr(entry, "published", None) or getattr(entry, "updated", None)
        if pub_str:
            try:
                dt = date_parser.parse(pub_str)
                return dt.isoformat()
            except Exception:
                pass
        return datetime.now().isoformat()

    async def _fetch_feed(self, url: str) -> List[Dict[str, Any]]:
        """Parses an RSS/XML feed asynchronously in a background thread."""
        loop = asyncio.get_event_loop()
        try:
            feed = await loop.run_in_executor(None, lambda: feedparser.parse(url))
            articles = []
            for entry in feed.entries:
                link = getattr(entry, "link", "")
                title = getattr(entry, "title", "")
                if not link or not title:
                    continue

                summary = self._clean_html(getattr(entry, "summary", "") or getattr(entry, "description", ""))
                title_clean = self._clean_html(title)
                
                # Extract source name
                source_name = "Financial Media"
                if hasattr(entry, "source") and hasattr(entry.source, "title"):
                    source_name = entry.source.title
                elif "economictimes" in link:
                    source_name = "The Economic Times"
                elif "livemint" in link:
                    source_name = "Livemint"
                elif "moneycontrol" in link:
                    source_name = "Moneycontrol"
                elif "business-standard" in link:
                    source_name = "Business Standard"

                articles.append({
                    "url_hash": self._hash_url(link),
                    "headline": title_clean,
                    "summary": summary[:400] if summary else title_clean,
                    "source_name": source_name,
                    "source_url": link,
                    "published_at": self._parse_pub_date(entry)
                })
            return articles
        except Exception as e:
            logger.warning(f"Failed to fetch feed {url}: {e}")
            return []

    async def fetch_stock_news(self, symbol: str, days: int = 3, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Fetches stock-specific news for an Indian company using Google News RSS.
        Leverages company name and known aliases from the Instrument Master for high precision.
        Saves new articles to database with deduplication.
        """
        sym_clean = symbol.upper().strip()
        inst = instrument_master.get_by_symbol(sym_clean)
        if inst:
            search_terms = [f'"{inst.company_name}"', f'"{sym_clean}"']
            if inst.aliases:
                for al in inst.aliases[:2]:
                    search_terms.append(f'"{al}"')
            query_str = " OR ".join(search_terms)
            query = f"({query_str}) stock NSE when:{days}d"
        else:
            query = f"{sym_clean} stock NSE when:{days}d"

        encoded_q = urllib.parse.quote_plus(query)
        url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-IN&gl=IN&ceid=IN:en"

        articles = await self._fetch_feed(url)
        for a in articles:
            a["symbol"] = sym_clean

        # Filter out duplicates and save new articles
        unique_articles = []
        seen_hashes = set()
        for a in articles:
            if a["url_hash"] not in seen_hashes:
                seen_hashes.add(a["url_hash"])
                unique_articles.append(a)

        if unique_articles:
            await db.save_news(unique_articles)

        return unique_articles[:limit]

    async def fetch_market_news(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetches macro Indian stock market news from Google News RSS and major financial feeds.
        Deduplicates against internal hashes and previously stored database articles.
        """
        google_news_url = "https://news.google.com/rss/search?q=Nifty+50+Sensex+Indian+market+when:1d&hl=en-IN&gl=IN&ceid=IN:en"
        feed_urls = [google_news_url] + self.config.news_rss_feed_urls

        tasks = [self._fetch_feed(u) for u in feed_urls]
        feed_results = await asyncio.gather(*tasks, return_exceptions=True)

        all_articles = []
        for res in feed_results:
            if isinstance(res, list):
                all_articles.extend(res)

        # In-memory deduplication by url_hash
        unique_articles = []
        seen_hashes = set()
        for a in all_articles:
            if a["url_hash"] not in seen_hashes:
                seen_hashes.add(a["url_hash"])
                unique_articles.append(a)

        # Sort newest first
        unique_articles.sort(key=lambda x: x["published_at"], reverse=True)

        # Save to database
        if unique_articles:
            await db.save_news(unique_articles)

        return unique_articles[:limit]

news_service = NewsService()
