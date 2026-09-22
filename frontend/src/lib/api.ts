/**
 * MarketMind API Client
 * Communicates with the Python FastAPI backend
 */

import {
  MarketOverview,
  StockInfo,
  MarketDataPoint,
  StockAnalysis,
  DailyReport,
  ReportSummary,
  ChatResponse,
  StockMover,
  Instrument,
  InstrumentSearchResult,
  UserTrackedStock,
  UserDailyReport,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface MarketNewsItem {
  title: string;
  link?: string;
  source?: string;
  pubDate?: string;
}

export interface StockDataResult {
  symbol: string;
  quote: MarketDataPoint;
  indicators: Record<string, unknown>;
}

const FALLBACK_OVERVIEW: MarketOverview = {
  nifty_close: 23414.30,
  nifty_change_percent: 0.29,
  benchmarks: {
    'NIFTY 50': { symbol: '^NSEI', name: 'NIFTY 50', close: 23414.30, change_percent: 0.29, prev_close: 23346.40 },
    'SENSEX': { symbol: '^BSESN', name: 'SENSEX', close: 76820.10, change_percent: 0.28, prev_close: 76605.00 },
    'BANK NIFTY': { symbol: '^NSEBANK', name: 'BANK NIFTY', close: 51240.50, change_percent: -0.12, prev_close: 51302.00 },
    'INDIA VIX': { symbol: '^INDIAVIX', name: 'INDIA VIX', close: 12.80, change_percent: -1.85, prev_close: 13.04 },
  },
  top_gainers: [],
  top_losers: [],
  advances: 32,
  declines: 18,
  sectors: [
    { sector: 'NIFTY AUTO', change_percent: 1.24, leaders: ['TATAMOTORS', 'M&M'], status: 'bullish' },
    { sector: 'NIFTY ENERGY', change_percent: 0.82, leaders: ['RELIANCE'], status: 'bullish' },
    { sector: 'NIFTY FMCG', change_percent: 0.45, leaders: ['ITC'], status: 'neutral' },
    { sector: 'NIFTY BANKING', change_percent: -0.12, leaders: ['ICICIBANK'], status: 'neutral' },
    { sector: 'NIFTY IT', change_percent: -0.38, leaders: ['TCS'], status: 'bearish' },
  ],
  timestamp: new Date().toISOString(),
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MarketMindAPI {
  private baseUrl: string;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private inFlight: Map<string, Promise<unknown>> = new Map();

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /** Clears client-side cache */
  clearCache(): void {
    this.cache.clear();
  }

  private async fetch<T>(
    endpoint: string, 
    options?: RequestInit, 
    ttlMs: number = 0, 
    forceRefresh: boolean = false
  ): Promise<T> {
    const isGet = !options?.method || options.method.toUpperCase() === 'GET';
    const cacheKey = `${options?.method || 'GET'}:${endpoint}`;

    // Return cached data if valid and not forcing refresh
    if (isGet && !forceRefresh && ttlMs > 0) {
      const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
      if (entry && Date.now() - entry.timestamp < entry.ttl) {
        return entry.data;
      }
    }

    // Deduplicate in-flight GET requests
    if (isGet && this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey) as Promise<T>;
    }

    const fetchPromise = (async () => {
      const url = `${this.baseUrl}${endpoint}`;
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API Error ${response.status}: ${errBody || response.statusText}`);
        }

        const data = await response.json();

        // Cache the successful GET response
        if (isGet && ttlMs > 0) {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
          });
        }

        return data as T;
      } catch (e: unknown) {
        console.warn(`Fetch error at ${endpoint}:`, e);
        throw e;
      } finally {
        if (isGet) {
          this.inFlight.delete(cacheKey);
        }
      }
    })();

    if (isGet) {
      this.inFlight.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }

  // Market Data
  async getMarketOverview(symbols?: string[], forceRefresh: boolean = false): Promise<MarketOverview> {
    try {
      const queryParams = new URLSearchParams();
      if (symbols && symbols.length > 0) {
        queryParams.set('symbols', symbols.join(','));
      }
      if (forceRefresh) {
        queryParams.set('force_refresh', 'true');
      }
      const qs = queryParams.toString();
      const endpoint = qs ? `/api/market/overview?${qs}` : '/api/market/overview';
      return await this.fetch<MarketOverview>(endpoint, undefined, 15000, forceRefresh);
    } catch (err) {
      console.warn('API: Failed to fetch live market overview, using resilient fallback:', err);
      return FALLBACK_OVERVIEW;
    }
  }

  async syncLiveMarket(symbols?: string[]): Promise<MarketOverview> {
    this.clearCache();
    try {
      const queryParams = symbols && symbols.length > 0 ? `?symbols=${encodeURIComponent(symbols.join(','))}` : '';
      return await this.fetch<MarketOverview>(`/api/market/sync${queryParams}`, { method: 'POST' });
    } catch (err) {
      console.warn('API: Live sync POST failed, falling back to overview refresh:', err);
      return this.getMarketOverview(symbols, true);
    }
  }

  async getStocks(forceRefresh: boolean = false): Promise<StockInfo[]> {
    return this.fetch<StockInfo[]>('/api/market/stocks', undefined, 300000, forceRefresh);
  }

  async getStockData(symbol: string, forceRefresh: boolean = false): Promise<StockDataResult> {
    return this.fetch<StockDataResult>(`/api/market/stock/${symbol}`, undefined, 30000, forceRefresh);
  }

  async getStockHistory(symbol: string, period: string = '3mo', forceRefresh: boolean = false): Promise<MarketDataPoint[]> {
    const qs = forceRefresh ? `period=${period}&force_refresh=true` : `period=${period}`;
    return this.fetch<MarketDataPoint[]>(`/api/market/history/${symbol}?${qs}`, undefined, 60000, forceRefresh);
  }

  async getMovers(threshold: number = 2.0, forceRefresh: boolean = false): Promise<StockMover[]> {
    return this.fetch<StockMover[]>(`/api/market/movers?threshold=${threshold}`, undefined, 30000, forceRefresh);
  }

  async getMarketNews(symbol?: string, limit: number = 10, forceRefresh: boolean = false): Promise<MarketNewsItem[]> {
    const endpoint = symbol ? `/api/market/news?symbol=${symbol}&limit=${limit}` : `/api/market/news?limit=${limit}`;
    return this.fetch<MarketNewsItem[]>(endpoint, undefined, 45000, forceRefresh);
  }

  // Analysis
  async getAnalysis(symbol: string): Promise<StockAnalysis> {
    return this.fetch<StockAnalysis>(`/api/analysis/${symbol}`);
  }

  async runAnalysis(symbol: string): Promise<StockAnalysis> {
    return this.fetch<StockAnalysis>(`/api/analysis/run/${symbol}`, { method: 'POST' });
  }

  // Reports
  async getLatestReport(): Promise<DailyReport> {
    return this.fetch<DailyReport>('/api/reports/latest');
  }

  async getReport(date: string): Promise<DailyReport> {
    return this.fetch<DailyReport>(`/api/reports/${date}`);
  }

  async getReportsList(): Promise<ReportSummary[]> {
    return this.fetch<ReportSummary[]>('/api/reports/list');
  }

  async generateReport(): Promise<DailyReport> {
    return this.fetch<DailyReport>('/api/reports/generate', { method: 'POST' });
  }

  // Chat
  async askMarketMind(query: string, userId?: string): Promise<ChatResponse> {
    let customKey: string | undefined = undefined;
    let effectiveUserId = userId;
    if (typeof window !== 'undefined') {
      customKey = localStorage.getItem('marketmind_gemini_key') || undefined;
      if (!effectiveUserId) {
        try {
          const userStr = localStorage.getItem('marketmind_user');
          if (userStr) {
            const u = JSON.parse(userStr);
            effectiveUserId = u?.email;
          }
        } catch {}
      }
    }
    const headers: Record<string, string> = {};
    if (customKey) {
      headers['X-Gemini-Key'] = customKey;
    }
    return this.fetch<ChatResponse>('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        user_id: effectiveUserId,
        custom_key: customKey,
      }),
    });
  }

  // Health
  async checkHealth(): Promise<{ status: string; gemini_configured: boolean; active_scheduler: boolean }> {
    return this.fetch('/api/health');
  }

  // Search & Instruments
  async searchInstruments(query: string): Promise<InstrumentSearchResult[]> {
    if (!query || !query.trim()) return [];
    return this.fetch<InstrumentSearchResult[]>(`/api/market/search?q=${encodeURIComponent(query.trim())}`);
  }

  async getAllInstruments(sector?: string): Promise<Instrument[]> {
    const endpoint = sector ? `/api/market/instruments?sector=${encodeURIComponent(sector)}` : '/api/market/instruments';
    return this.fetch<Instrument[]>(endpoint);
  }

  // User Dynamic Stock Tracking
  async getUserTrackedStocks(userId: string = 'demo.analyst@marketmind.ai'): Promise<UserTrackedStock[]> {
    try {
      return await this.fetch<UserTrackedStock[]>(`/api/user/tracked?user_id=${encodeURIComponent(userId)}`);
    } catch (err) {
      console.warn('API: Failed to fetch user tracked stocks:', err);
      return [];
    }
  }

  async trackStock(
    symbol: string,
    userId: string = 'demo.analyst@marketmind.ai',
    customGroup: string = 'Default'
  ): Promise<{ status: string; symbol: string; message: string }> {
    return this.fetch<{ status: string; symbol: string; message: string }>('/api/user/track', {
      method: 'POST',
      body: JSON.stringify({
        symbol: symbol.toUpperCase().trim(),
        user_id: userId,
        custom_group: customGroup,
      }),
    });
  }

  async untrackStock(
    symbol: string,
    userId: string = 'demo.analyst@marketmind.ai'
  ): Promise<{ status: string; symbol: string; message: string }> {
    const sym = symbol.toUpperCase().trim();
    return this.fetch<{ status: string; symbol: string; message: string }>(
      `/api/user/track/${encodeURIComponent(sym)}?user_id=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
  }

  // User Personalized Reports
  async getUserDailyReports(userId: string = 'demo.analyst@marketmind.ai'): Promise<UserDailyReport[]> {
    try {
      return await this.fetch<UserDailyReport[]>(`/api/user/reports?user_id=${encodeURIComponent(userId)}`);
    } catch (err) {
      console.warn('API: Failed to fetch user daily reports:', err);
      return [];
    }
  }

  async getUserDailyReportByDate(
    date: string,
    userId: string = 'demo.analyst@marketmind.ai'
  ): Promise<UserDailyReport> {
    return this.fetch<UserDailyReport>(
      `/api/user/reports/${encodeURIComponent(date)}?user_id=${encodeURIComponent(userId)}`
    );
  }

  async generateUserDailyReport(
    userId: string = 'demo.analyst@marketmind.ai',
    symbols?: string[]
  ): Promise<UserDailyReport> {
    return this.fetch<UserDailyReport>('/api/user/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, symbols }),
    });
  }

  // Gemini API Key dynamic configuration
  async setGeminiKey(apiKey: string, userId?: string): Promise<{ status: string; message?: string; gemini_configured: boolean }> {
    let effectiveUserId = userId;
    if (!effectiveUserId && typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('marketmind_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          effectiveUserId = u?.email;
        }
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketmind_gemini_key', apiKey.trim());
    }
    return this.fetch<{ status: string; message?: string; gemini_configured: boolean }>('/api/config/gemini-key', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey.trim(), user_id: effectiveUserId }),
    });
  }
}

export const api = new MarketMindAPI();
export default MarketMindAPI;

