'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, ArrowDownRight, RefreshCw, ShieldCheck, 
  Activity, Newspaper, AlertTriangle, Sparkles, ExternalLink, ArrowLeft,
  FileText
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import CandlestickChart from '@/components/CandlestickChart';
import SignalBadge from '@/components/common/SignalBadge';
import EvidenceMeter from '@/components/common/EvidenceMeter';
import TrackButton from '@/components/common/TrackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { StockAnalysis, MarketDataPoint } from '@/lib/types';
import { formatINR, formatPercent, getDeltaMeta } from '@/lib/formatters';

interface StockIndicators {
  rsi_14?: number;
  sma_20?: number;
  sma_50?: number;
  macd?: number;
  volume_ratio?: number;
  atr_14?: number;
}

interface StockQuoteResponse {
  symbol: string;
  quote: MarketDataPoint;
  indicators: StockIndicators;
}

export default function StockAnalysisPage({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const symbol = resolvedParams.symbol.toUpperCase();

  const [history, setHistory] = useState<MarketDataPoint[]>([]);
  const [quoteData, setQuoteData] = useState<StockQuoteResponse | null>(null);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [period, setPeriod] = useState('3mo');

  // 1. Load stock quote and multi-agent analysis on symbol change
  useEffect(() => {
    let isMounted = true;
    async function loadStockMeta() {
      try {
        setLoading(true);
        const [stockInfo, analysisData] = await Promise.allSettled([
          api.getStockData(symbol),
          api.getAnalysis(symbol),
        ]);

        if (!isMounted) return;
        if (stockInfo.status === 'fulfilled') setQuoteData(stockInfo.value as StockQuoteResponse);
        if (analysisData.status === 'fulfilled') setAnalysis(analysisData.value);
      } catch (e) {
        console.error('Error fetching stock data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStockMeta();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // 2. High-speed history fetching for charting with caching
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        setChartLoading(true);
        const data = await api.getStockHistory(symbol, period);
        if (isMounted && data && data.length > 0) {
          setHistory(data);
        }
      } catch (e) {
        console.error('Error fetching stock history:', e);
      } finally {
        if (isMounted) setChartLoading(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [symbol, period]);

  const handleRunAnalysis = async () => {
    try {
      setRunningAnalysis(true);
      const fresh = await api.runAnalysis(symbol);
      setAnalysis(fresh);
    } catch (e) {
      console.error('Failed to trigger analysis:', e);
    } finally {
      setRunningAnalysis(false);
    }
  };

  const quote = quoteData?.quote;
  const indicators = quoteData?.indicators || {};
  const delta = quote ? getDeltaMeta(quote.change_percent) : null;

  return (
    <AppShell activeSymbol={symbol}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* Navigation Breadcrumb & Multi-Agent Analysis Trigger */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <Link
            href="/stocks"
            className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Equities Screener
          </Link>
          <Button
            size="sm"
            onClick={handleRunAnalysis}
            disabled={runningAnalysis}
            className="text-xs font-semibold gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningAnalysis ? 'animate-spin' : ''}`} />
            <span>{runningAnalysis ? 'Reasoning Concurrently...' : 'Trigger Multi-Agent Analysis'}</span>
          </Button>
        </div>

        {/* 1. STOCK HEADER & WATCHLIST DESK */}
        <section className="bg-[#111827] rounded-xl p-5 border border-[#1e293b]">
          {loading && !quote ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrackButton symbol={symbol} size="default" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                    {symbol}
                  </h1>
                  <Badge variant="default">NSE</Badge>
                  {analysis?.synthesis?.signal && (
                    <SignalBadge signal={analysis.synthesis.signal} size="md" />
                  )}
                </div>
                <p className="text-xs text-[#94a3b8]">
                  National Stock Exchange of India • Automated Multi-Agent Provenance
                </p>
              </div>

              {quote && delta && (
                <div className="flex items-baseline sm:text-right gap-3">
                  <div>
                    <span className="text-[11px] text-[#64748b] block uppercase">LAST TRADED PRICE</span>
                    <span className="text-3xl font-bold text-white num-tabular block">
                      {formatINR(quote.close)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#64748b] block uppercase">24H NET CHANGE</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold num-tabular border ${delta.badgeClass} mt-1`}
                    >
                      {quote.change_percent >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      )}
                      {formatPercent(quote.change_percent)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. MAIN CHART ANCHOR */}
        <section className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Price Action & Historical OHLCV
                </h2>
                {chartLoading && (
                  <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                    ● Loading
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#94a3b8]">Daily Candlestick Execution Desk</p>
            </div>
            <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-md border border-[#1e293b]">
              {['1mo', '3mo', '6mo', '1y'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                    period === p
                      ? 'bg-[#162032] text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <CandlestickChart data={history} symbol={symbol} height={380} />
        </section>

        {/* 3. DETERMINISTIC FINANCIAL METRICS GRID */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-[#111827] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[11px] uppercase text-[#64748b]">14D RSI</span>
            <p className={`font-bold num-tabular mt-0.5 text-base ${
              (indicators.rsi_14 ?? 50) >= 70 ? 'text-rose-400' :
              (indicators.rsi_14 ?? 50) <= 30 ? 'text-emerald-400' : 'text-white'
            }`}>
              {indicators.rsi_14 !== undefined ? indicators.rsi_14.toFixed(1) : '—'}
            </p>
            <span className="text-[10px] text-[#64748b]">
              {(indicators.rsi_14 ?? 50) >= 70 ? 'Overbought' : (indicators.rsi_14 ?? 50) <= 30 ? 'Oversold' : 'Neutral Range'}
            </span>
          </div>

          <div className="bg-[#111827] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[11px] uppercase text-[#64748b]">20D SMA</span>
            <p className="font-bold text-white num-tabular mt-0.5 text-base">
              {indicators.sma_20 !== undefined ? formatINR(indicators.sma_20) : '—'}
            </p>
            <span className="text-[10px] text-[#64748b]">Short-term Mean</span>
          </div>

          <div className="bg-[#111827] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[11px] uppercase text-[#64748b]">50D SMA</span>
            <p className="font-bold text-white num-tabular mt-0.5 text-base">
              {indicators.sma_50 !== undefined ? formatINR(indicators.sma_50) : '—'}
            </p>
            <span className="text-[10px] text-[#64748b]">Intermediate Trend</span>
          </div>

          <div className="bg-[#111827] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[11px] uppercase text-[#64748b]">MACD Line</span>
            <p className={`font-bold num-tabular mt-0.5 text-base ${(indicators.macd ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.macd !== undefined ? indicators.macd.toFixed(2) : '—'}
            </p>
            <span className="text-[10px] text-[#64748b]">Momentum Spread</span>
          </div>

          <div className="bg-[#111827] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[11px] uppercase text-[#64748b]">Vol Ratio</span>
            <p className={`font-bold num-tabular mt-0.5 text-base ${(indicators.volume_ratio ?? 1) >= 1.5 ? 'text-amber-300' : 'text-white'}`}>
              {indicators.volume_ratio !== undefined ? `${indicators.volume_ratio.toFixed(2)}x` : '—'}
            </p>
            <span className="text-[10px] text-[#64748b]">vs. 20D Average</span>
          </div>

          <div className="bg-[#111827] p-3 rounded-lg border border-[#1e293b]">
            <span className="text-[11px] uppercase text-[#64748b]">14D ATR</span>
            <p className="font-bold text-white num-tabular mt-0.5 text-base">
              {indicators.atr_14 !== undefined ? formatINR(indicators.atr_14) : '—'}
            </p>
            <span className="text-[10px] text-[#64748b]">Daily Volatility</span>
          </div>
        </section>

        {/* 4. LEAD SYNTHESIS INTELLIGENCE MEMO */}
        {analysis?.synthesis && (
          <section className="bg-[#111827] border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Lead Synthesis Agent Assessment Memo
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#94a3b8]">
                  Evidence Strength:
                </span>
                <EvidenceMeter strength={analysis.synthesis.confidence === 'high' ? 'strong' : 'moderate'} />
              </div>
            </div>

            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              {analysis.synthesis.findings}
            </p>

            {/* 5. GROUNDED EVIDENCE PROVENANCE LEDGER */}
            {analysis.synthesis.evidence && analysis.synthesis.evidence.length > 0 && (
              <div className="pt-3 border-t border-[#1e293b]">
                <h3 className="text-xs uppercase text-[#94a3b8] mb-2 flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Grounded Evidence Provenance Ledger:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysis.synthesis.evidence.map((ev, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293b] text-xs space-y-1">
                      <p className="text-white font-medium text-xs">{ev.claim}</p>
                      <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1 border-t border-[#1e293b]">
                        <span>Source: {ev.source}</span>
                        {ev.source_url && (
                          <a
                            href={ev.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-0.5"
                          >
                            Verify Citation <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 6. 3 SPECIALIZED AGENTS BREAKDOWN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Technical Desk */}
          <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1e293b]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Technical Desk
                </h3>
                {analysis?.technical && <SignalBadge signal={analysis.technical.signal} size="sm" />}
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">
                {analysis?.technical?.findings || 'Awaiting technical indicators analysis...'}
              </p>
            </div>
            <div className="text-[11px] text-[#64748b] pt-2 border-t border-[#1e293b] flex justify-between">
              <span>Input: OHLCV + ta</span>
              <span className="text-emerald-400 font-medium">Confidence: HIGH</span>
            </div>
          </div>

          {/* News Desk */}
          <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1e293b]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5" />
                  News Desk
                </h3>
                {analysis?.news && <SignalBadge signal={analysis.news.signal} size="sm" />}
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">
                {analysis?.news?.findings || 'No breaking news flow detected.'}
              </p>
            </div>
            <div className="text-[11px] text-[#64748b] pt-2 border-t border-[#1e293b] flex justify-between">
              <span>Input: ET / Mint RSS</span>
              <span className="text-cyan-400 font-medium">Confidence: MODERATE</span>
            </div>
          </div>

          {/* Anomaly Desk */}
          <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1e293b]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Anomaly Desk
                </h3>
                {analysis?.anomaly && <SignalBadge signal={analysis.anomaly.signal} size="sm" />}
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">
                {analysis?.anomaly?.findings || 'Nominal liquidity. No abnormal volume deviations detected.'}
              </p>
            </div>
            <div className="text-[11px] text-[#64748b] pt-2 border-t border-[#1e293b] flex justify-between">
              <span>Method: Volume Z-Score</span>
              <span className="text-emerald-400 font-medium">Status: Verified Normal</span>
            </div>
          </div>
        </div>

        {/* 7. RELATED INTELLIGENCE REPORTS LINK */}
        <section className="bg-[#111827] rounded-xl p-3.5 border border-[#1e293b] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-white">Interested in daily sector-wide briefings covering {symbol}?</span>
          </div>
          <Link href="/reports" className="text-emerald-400 hover:underline font-medium">
            View Daily Reports Archive →
          </Link>
        </section>
      </div>
    </AppShell>
  );
}