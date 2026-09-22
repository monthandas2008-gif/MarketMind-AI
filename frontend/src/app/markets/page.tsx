'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  BarChart3, RefreshCw, Layers, Filter, ChevronRight,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import SparklineCard from '@/components/common/SparklineCard';
import BreadthGauge from '@/components/common/BreadthGauge';
import SignalBadge from '@/components/common/SignalBadge';
import EvidenceMeter from '@/components/common/EvidenceMeter';
import TrackButton from '@/components/common/TrackButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { MarketOverview, StockInfo, MarketDataPoint, SectorPerformance } from '@/lib/types';
import { formatINR, formatPercent } from '@/lib/formatters';

interface StockQuoteData {
  quote: MarketDataPoint;
  indicators: {
    rsi_14?: number;
    volume_ratio?: number;
    macd?: number;
    macd_signal?: number;
  };
}

export default function MarketsPage() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuoteData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [ovData, stocksData] = await Promise.allSettled([
        isRefresh ? api.syncLiveMarket() : api.getMarketOverview(),
        api.getStocks(isRefresh),
      ]);

      if (ovData.status === 'fulfilled') setOverview(ovData.value);
      if (stocksData.status === 'fulfilled') {
        setStocks(stocksData.value);
        const symbols = stocksData.value.filter((s) => s.symbol !== 'NIFTY50').map((s) => s.symbol);
        const quoteResults = await Promise.allSettled(
          symbols.map((sym) => api.getStockData(sym, isRefresh))
        );
        const qMap: Record<string, StockQuoteData> = {};
        quoteResults.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            qMap[symbols[i]] = res.value as StockQuoteData;
          }
        });
        setQuotes(qMap);
      }
    } catch (err) {
      console.error('Error loading markets data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [ovData, stocksData] = await Promise.allSettled([
          api.getMarketOverview(),
          api.getStocks(),
        ]);

        if (!isMounted) return;
        if (ovData.status === 'fulfilled') setOverview(ovData.value);
        if (stocksData.status === 'fulfilled') {
          setStocks(stocksData.value);
          const symbols = stocksData.value.filter((s) => s.symbol !== 'NIFTY50').map((s) => s.symbol);
          const quoteResults = await Promise.allSettled(
            symbols.map((sym) => api.getStockData(sym))
          );
          if (!isMounted) return;
          const qMap: Record<string, StockQuoteData> = {};
          quoteResults.forEach((res, i) => {
            if (res.status === 'fulfilled') {
              qMap[symbols[i]] = res.value as StockQuoteData;
            }
          });
          setQuotes(qMap);
        }
      } catch (e) {
        console.error('Error in markets init:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();
    const timer = setInterval(() => {
      loadData(true);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [loadData]);

  const benchmarks = overview?.benchmarks || {};
  const nifty = benchmarks['NIFTY 50'] || { close: overview?.nifty_close || 23346.40, change_percent: overview?.nifty_change_percent || 0.33 };
  const sensex = benchmarks['SENSEX'] || { close: 76820.10, change_percent: 0.28 };
  const bankNifty = benchmarks['BANK NIFTY'] || { close: 49850.20, change_percent: -0.12 };
  const indiaVix = benchmarks['INDIA VIX'] || { close: 13.42, change_percent: -2.40 };

  const advances = overview?.advances || 32;
  const declines = overview?.declines || 18;

  const defaultSectors: SectorPerformance[] = [
    { sector: 'NIFTY AUTO', change_percent: 1.24, leaders: ['M&M', 'TATAMOTORS'], status: 'bullish' },
    { sector: 'NIFTY ENERGY', change_percent: 0.85, leaders: ['RELIANCE', 'NTPC'], status: 'bullish' },
    { sector: 'NIFTY FMCG', change_percent: 0.45, leaders: ['ITC', 'HUL'], status: 'bullish' },
    { sector: 'NIFTY BANK', change_percent: -0.12, leaders: ['ICICIBANK', 'HDFCBANK'], status: 'neutral' },
    { sector: 'NIFTY IT', change_percent: -0.68, leaders: ['TCS', 'INFY'], status: 'bearish' },
  ];
  const sectorList = overview?.sectors && overview.sectors.length > 0 ? overview.sectors : defaultSectors;

  const filteredStocks = stocks.filter((s) => {
    if (s.symbol === 'NIFTY50') return false;
    if (selectedSectorFilter === 'ALL') return true;
    return s.sector?.toLowerCase().includes(selectedSectorFilter.toLowerCase());
  });

  return (
    <AppShell>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                NSE / BSE Market Structure & Breadth
              </h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Sectoral rotation matrix, advance/decline breadth metrics, and liquidity telemetry.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="text-xs text-[#94a3b8] hover:text-white border-[#1e293b] bg-[#111827] h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Live'}</span>
          </Button>
        </div>

        {/* SECTION 1: BENCHMARKS & MARKET BREADTH GAUGE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#111827] p-4 rounded-xl border border-[#1e293b] space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))
            ) : (
              <>
                <SparklineCard
                  title="NIFTY 50"
                  ticker="NSE: ^NSEI"
                  value={nifty.close}
                  change={nifty.change_percent}
                  sparklineData={[23100, 23200, 23150, 23280, 23346]}
                />
                <SparklineCard
                  title="SENSEX"
                  ticker="BSE: ^BSESN"
                  value={sensex.close}
                  change={sensex.change_percent}
                  sparklineData={[76300, 76500, 76400, 76750, 76820]}
                />
                <SparklineCard
                  title="BANK NIFTY"
                  ticker="NSE: ^NSEBANK"
                  value={bankNifty.close}
                  change={bankNifty.change_percent}
                  sparklineData={[50000, 49900, 49950, 49800, 49850]}
                />
                <SparklineCard
                  title="INDIA VIX"
                  ticker="VOLATILITY"
                  value={indiaVix.close}
                  change={indiaVix.change_percent}
                  prefix=""
                  sparklineData={[14.8, 14.2, 13.9, 13.6, 13.42]}
                />
              </>
            )}
          </div>

          <div className="lg:col-span-4">
            <BreadthGauge advances={advances} declines={declines} />
          </div>
        </section>

        {/* SECTION 2: DEDICATED SECTOR ROTATION MATRIX */}
        <section className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                  Sector Rotation Matrix (NSE Thematic Indices)
                </h2>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Relative performance ranked by daily net change and institutional bias.
              </p>
            </div>
            <Badge variant="default" className="hidden sm:inline-flex">
              NSE LIVE FEED
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {sectorList.map((sec) => {
              const isPositive = sec.change_percent >= 0;
              return (
                <div 
                  key={sec.sector}
                  className="bg-[#0b0f19] rounded-xl border border-[#1e293b] hover:border-[#334155] p-4 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white tracking-tight">{sec.sector}</span>
                    <span className={`text-xs font-semibold flex items-center num-tabular ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {formatPercent(sec.change_percent)}
                    </span>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-[#1e293b] space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                      <span>Leaders:</span>
                      <span className="text-white font-medium">{sec.leaders.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                      <span>Bias:</span>
                      <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sec.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: WATCHLIST SCREENER TABLE */}
        <section className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                Monitored Equities Screener & Indicators
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Deterministic mathematical computations: RSI (14), Volume Multipliers, and Evidence Strengths.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0b0f19] p-1 rounded-lg border border-[#1e293b] text-xs">
              <span className="text-[11px] text-[#64748b] px-1.5 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Sector:
              </span>
              {['ALL', 'Energy', 'Technology', 'Banking', 'Consumer'].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSectorFilter(sec)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    selectedSectorFilter === sec
                      ? 'bg-[#162032] text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e293b] text-xs uppercase text-[#64748b]">
                  <TableHead className="w-10 text-center">Track</TableHead>
                  <TableHead>Symbol / Security</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">LTP (₹)</TableHead>
                  <TableHead className="text-right">Net 24H</TableHead>
                  <TableHead className="text-right">Volume Multiplier</TableHead>
                  <TableHead className="text-center">RSI (14)</TableHead>
                  <TableHead className="text-center">Signal</TableHead>
                  <TableHead className="text-center">Evidence</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredStocks.map((stock) => {
                  const q = quotes[stock.symbol]?.quote;
                  const ind = quotes[stock.symbol]?.indicators;
                  const price = q?.close ?? 0;
                  const change = q?.change_percent ?? 0;
                  const volRatio = ind?.volume_ratio ?? 1.0;
                  const rsi = ind?.rsi_14 ?? 50;

                  let signal: 'bullish' | 'neutral' | 'bearish' = 'neutral';
                  if (change > 0.5 && rsi > 52) signal = 'bullish';
                  else if (change < -0.5 || rsi < 45) signal = 'bearish';

                  const evidence: 'strong' | 'moderate' | 'limited' = volRatio > 1.3 ? 'strong' : 'moderate';

                  return (
                    <TableRow key={stock.symbol} className="border-[#1e293b]/60 hover:bg-[#162032]/60">
                      <TableCell className="text-center">
                        <TrackButton symbol={stock.symbol} companyName={stock.company_name} sector={stock.sector} size="sm" />
                      </TableCell>
                      <TableCell>
                        <Link href={`/stock/${stock.symbol}`} className="font-bold text-white hover:text-emerald-400 flex items-center gap-1.5 transition-colors">
                          <span className="tracking-wide font-mono">{stock.symbol}</span>
                          <span className="text-[11px] font-normal text-[#64748b] truncate max-w-[140px]">{stock.company_name}</span>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <span className="bg-[#0b0f19] px-2 py-0.5 rounded text-[11px] border border-[#1e293b] text-[#94a3b8]">
                          {stock.sector}
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-bold text-white num-tabular">
                        {price > 0 ? formatINR(price) : '—'}
                      </TableCell>

                      <TableCell className="text-right">
                        <span className={`font-semibold inline-flex items-center gap-0.5 num-tabular ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {formatPercent(change)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right num-tabular">
                        <span className={volRatio >= 1.5 ? 'text-amber-300 font-bold' : 'text-[#cbd5e1]'}>
                          {volRatio.toFixed(2)}x
                        </span>
                      </TableCell>

                      <TableCell className="text-center num-tabular">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rsi >= 70 ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' :
                          rsi <= 30 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                          'text-[#cbd5e1]'
                        }`}>
                          {rsi.toFixed(1)}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <SignalBadge signal={signal} size="sm" />
                      </TableCell>

                      <TableCell className="text-center">
                        <EvidenceMeter strength={evidence} />
                      </TableCell>

                      <TableCell className="text-right">
                        <Link 
                          href={`/stock/${stock.symbol}`}
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-medium"
                        >
                          Deep Dive <ChevronRight className="w-3 h-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}