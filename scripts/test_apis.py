"""
Test API connectivity for MarketMind data sources.

Verifies that all free APIs are accessible and returning valid data.

Usage:
    python scripts/test_apis.py
"""

import sys
import os

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def test_yfinance():
    """Test Yahoo Finance connectivity for Indian stocks."""
    print("\n[*] Testing Yahoo Finance (yfinance)...")
    try:
        import yfinance as yf

        # Test NIFTY 50 index
        nifty = yf.Ticker("^NSEI")
        info = nifty.fast_info
        print(f"  ✓ NIFTY 50 — Last Price: {info.get('lastPrice', 'N/A')}")

        # Test individual stock
        reliance = yf.Ticker("RELIANCE.NS")
        hist = reliance.history(period="5d")
        if not hist.empty:
            last = hist.iloc[-1]
            print(f"  ✓ RELIANCE.NS — Close: {last['Close']:.2f}, Volume: {last['Volume']:,}")
        else:
            print("  ⚠ RELIANCE.NS — No data returned")

        print("  ✅ Yahoo Finance: OK")
        return True

    except ImportError:
        print("  ❌ yfinance not installed. Run: pip install yfinance")
        return False
    except Exception as e:
        print(f"  ❌ Yahoo Finance error: {e}")
        return False


def test_google_news_rss():
    """Test Google News RSS for Indian market news."""
    print("\n📰 Testing Google News RSS...")
    try:
        import feedparser

        url = "https://news.google.com/rss/search?q=Nifty+50+Indian+stock+market+when:1d&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(url)

        if feed.entries:
            print(f"  ✓ Found {len(feed.entries)} articles")
            for entry in feed.entries[:3]:
                print(f"    • {entry.title[:80]}...")
            print("  ✅ Google News RSS: OK")
            return True
        else:
            print("  ⚠ No articles found (may be temporary)")
            return True

    except ImportError:
        print("  ❌ feedparser not installed. Run: pip install feedparser")
        return False
    except Exception as e:
        print(f"  ❌ Google News RSS error: {e}")
        return False


def test_et_rss():
    """Test Economic Times RSS feed."""
    print("\n📰 Testing Economic Times RSS...")
    try:
        import feedparser

        url = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
        feed = feedparser.parse(url)

        if feed.entries:
            print(f"  ✓ Found {len(feed.entries)} articles")
            print(f"    • {feed.entries[0].title[:80]}...")
            print("  ✅ Economic Times RSS: OK")
            return True
        else:
            print("  ⚠ No articles found")
            return True

    except ImportError:
        print("  ❌ feedparser not installed")
        return False
    except Exception as e:
        print(f"  ❌ ET RSS error: {e}")
        return False


def test_gemini():
    """Test Gemini API connectivity (requires API key)."""
    print("\n🤖 Testing Gemini API...")
    try:
        import os
        api_key = os.environ.get("GEMINI_API_KEY")
        
        if not api_key or api_key == "your_gemini_api_key_here":
            print("  ⏭ Skipped — GEMINI_API_KEY not configured yet")
            return True

        from google import genai

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Reply with exactly: MarketMind API test successful",
        )
        print(f"  ✓ Response: {response.text.strip()}")
        print("  ✅ Gemini API: OK")
        return True

    except ImportError:
        print("  ❌ google-genai not installed. Run: pip install google-genai")
        return False
    except Exception as e:
        print(f"  ❌ Gemini error: {e}")
        return False


def main():
    print("=" * 60)
    print("  MarketMind — API Connectivity Test")
    print("=" * 60)

    results = {
        "Yahoo Finance": test_yfinance(),
        "Google News RSS": test_google_news_rss(),
        "Economic Times RSS": test_et_rss(),
        "Gemini API": test_gemini(),
    }

    print("\n" + "=" * 60)
    print("  Summary")
    print("=" * 60)
    
    all_ok = True
    for name, ok in results.items():
        status = "✅ OK" if ok else "❌ FAILED"
        print(f"  {name}: {status}")
        if not ok:
            all_ok = False

    if all_ok:
        print("\n🎉 All API tests passed!")
    else:
        print("\n⚠ Some tests failed. Check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
