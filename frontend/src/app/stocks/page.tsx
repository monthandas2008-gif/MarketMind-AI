'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Search, ArrowUpRight, ArrowDownRight, 
  Layers, ChevronRight, LayoutGrid, List, ArrowUpDown,
  Bookmark, Plus
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import SignalBadge from '@/components/common/SignalBadge';
import TrackButton from '@/components/common/TrackButton';
import StockSearchModal from '@/components/common/StockSearchModal';
import { useTracking } from '@/lib/tracking';
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
import { StockInfo, MarketDataPoint } from '@/lib/types';
import { formatINR, formatPercent } from '@/lib/formatters';

interface StockQuoteData {
  quote: MarketDataPoint;
  indicators: {
    rsi_14?: number;
    volume_ratio?: number;
  };
}

export default function StocksDirectoryPage() {
  const { trackedStocks, isTracked } = useTracking();

  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [quotes, setQuotes] = useState<Record<string, StockQuoteData>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activeTab, setActiveTab] = useState<'all' | 'tracked'>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'change' | 'rsi' | 'volume'>('symbol');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [stocksData, trackedData] = await Promise.allSettled([
          api.getStocks(),
          api.getUserTrackedStocks(),
        ]);

        if (!isMounted) return;
        if (stocksData.status === 'fulfilled') {
          setStocks(stocksData.value);
        }

        const qMap: Record<string, StockQuoteData> = {};
        if (trackedData.status === 'fulfilled') {
          trackedData.value.forEach((t) => {
            if (t.quote) {
              qMap[t.symbol] = {
                quote: t.quote,
                indicators: { rsi_14: 55, volume_ratio: 1.1 },
              };
            }
          });
        }
        setQuotes(qMap);
      } catch (e) {
        console.error('Error fetching stock universe:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const sectors = ['ALL', ...Array.from(new Set(stocks.map((s) => s.sector).filter(Boolean)))];

  const filtered = stocks
    .filter((s) => {
      if (s.symbol === 'NIFTY50') return false;
      if (activeTab === 'tracked' && !isTracked(s.symbol)) return false;
      const matchSearch =
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.company_name.toLowerCase().includes(search.toLowerCase()) ||
        s.sector.toLowerCase().includes(search.toLowerCase());
      const matchSector = selectedSector === 'ALL' || s.sector === selectedSector;
      return matchSearch && matchSector;
    })
    .sort((a, b) => {
      const qA = quotes[a.symbol]?.quote;
      const qB = quotes[b.symbol]?.quote;
      const indA = quotes[a.symbol]?.indicators;
      const indB = quotes[b.symbol]?.indicators;

      if (sortBy === 'change') {
        return (qB?.change_percent ?? 0) - (qA?.change_percent ?? 0);
      }
      if (sortBy === 'rsi') {
        return (indB?.rsi_14 ?? 50) - (indA?.rsi_14 ?? 50);
      }
      if (sortBy === 'volume') {
        return (indB?.volume_ratio ?? 1) - (indA?.volume_ratio ?? 1);
      }
      return a.symbol.localeCompare(b.symbol);
    });

  return (
    <AppShell>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* PAGE TITLE & COUNTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                Equities Screener & Dynamic Tracking
              </h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Active NSE/BSE coverage across liquid instruments. Any tracked stock enters our full 4-agent intelligence pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/25 transition-all font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Search & Track Stock</span>
            </button>
            <Badge variant="bullish">
              {filtered.length} Equities Listed
            </Badge>
          </div>
        </div>

        {/* TOP CONTROLS: TRACKED TAB, SEARCH, SORT & VIEW TOGGLE */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* All vs Tracked Tab Switcher */}
          <div className="flex bg-[#0b0f19] p-1 rounded-lg border border-[#1e293b] text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all font-semibold ${
                activeTab === 'all'
                  ? 'bg-[#111827] text-white border border-[#1e293b] shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              All Equities ({stocks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tracked')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all font-semibold flex items-center justify-center gap-1.5 ${
                activeTab === 'tracked'
                  ? 'bg-[#111827] text-amber-400 border border-[#1e293b] shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>My Tracked ({trackedStocks.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search ticker, company or sector (e.g. RELIANCE, TATAMOTORS, AUTO)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#111827] border border-[#1e293b] hover:border-[#334155] focus:border-emerald-500 rounded-lg text-xs text-white placeholder-[#64748b] focus:outline-none transition-all h-9"
            />
          </div>

          {/* Sort Selector & Grid/Table Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1e293b] px-2.5 py-1.5 rounded-lg text-xs text-[#94a3b8] h-9">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748b]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'symbol' | 'change' | 'rsi' | 'volume')}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="symbol" className="bg-[#111827]">Symbol A-Z</option>
                <option value="change" className="bg-[#111827]">Net Change %</option>
                <option value="rsi" className="bg-[#111827]">RSI (14D)</option>
                <option value="volume" className="bg-[#111827]">Volume Multiplier</option>
              </select>
            </div>

            <div className="flex bg-[#111827] p-1 rounded-lg border border-[#1e293b] text-xs h-9 items-center">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-[#162032] text-emerald-400' : 'text-[#64748b]'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#162032] text-emerald-400' : 'text-[#64748b]'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {sectors.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors whitespace-nowrap font-medium ${
                selectedSector === sec
                  ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                  : 'bg-[#111827] text-[#94a3b8] border border-[#1e293b] hover:text-white hover:border-[#334155]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* CONTENT DISPLAY: TABLE (DEFAULT) OR GRID */}
        {loading ? (
          <div className="bg-[#111827] p-5 rounded-xl border border-[#1e293b] space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#162032] border border-[#1e293b] flex items-center justify-center mx-auto text-[#64748b]">
              <Bookmark className="w-5 h-5 text-amber-400/60" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {activeTab === 'tracked' ? 'No Tracked Equities Found' : 'No Matching Equities'}
            </h3>
            <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
              {activeTab === 'tracked'
                ? 'You are not tracking any equities currently. Track any stock to trigger our complete 4-desk intelligence pipeline.'
                : 'Adjust your search query or clear the sector filter to see more equities.'}
            </p>
            {activeTab === 'tracked' ? (
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 hover:bg-emerald-500/25 transition-all font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Search & Track Equities</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedSector('ALL');
                }}
                className="mt-2 text-xs text-emerald-400 hover:underline font-medium"
              >
                ← Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e293b] text-xs uppercase text-[#64748b]">
                  <TableHead className="w-20 text-center">Track</TableHead>
                  <TableHead>Symbol / Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Net 24H</TableHead>
                  <TableHead className="text-right">Vol Ratio</TableHead>
                  <TableHead className="text-center">RSI (14D)</TableHead>
                  <TableHead className="text-center">Signal</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filtered.map((stock) => {
                  const q = quotes[stock.symbol]?.quote;
                  const ind = quotes[stock.symbol]?.indicators;
                  const price = q?.close ?? 0;
                  const change = q?.change_percent ?? 0;
                  const volRatio = ind?.volume_ratio ?? 1.0;
                  const rsi = ind?.rsi_14 ?? 50;

                  let signal: 'bullish' | 'neutral' | 'bearish' = 'neutral';
                  if (change > 0.5 && rsi > 52) signal = 'bullish';
                  else if (change < -0.5 || rsi < 45) signal = 'bearish';

                  return (
                    <TableRow key={stock.symbol} className="border-[#1e293b]/60 hover:bg-[#162032]/60">
                      <TableCell className="text-center">
                        <TrackButton symbol={stock.symbol} companyName={stock.company_name} sector={stock.sector} size="sm" />
                      </TableCell>
                      <TableCell>
                        <Link href={`/stock/${stock.symbol}`} className="font-bold text-white hover:text-emerald-400 flex items-center gap-2">
                          <span className="tracking-wide font-mono">{stock.symbol}</span>
                          <span className="text-[11px] text-[#64748b] font-normal truncate max-w-[150px]">{stock.company_name}</span>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((stock) => {
              const q = quotes[stock.symbol]?.quote;
              const ind = quotes[stock.symbol]?.indicators;
              const price = q?.close ?? 0;
              const change = q?.change_percent ?? 0;
              const volRatio = ind?.volume_ratio ?? 1.0;
              const rsi = ind?.rsi_14 ?? 50;

              let signal: 'bullish' | 'neutral' | 'bearish' = 'neutral';
              if (change > 0.5 && rsi > 52) signal = 'bullish';
              else if (change < -0.5 || rsi < 45) signal = 'bearish';

              return (
                <div
                  key={stock.symbol}
                  className="bg-[#111827] hover:bg-[#162032] rounded-xl p-4.5 border border-[#1e293b] hover:border-[#334155] flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TrackButton symbol={stock.symbol} companyName={stock.company_name} sector={stock.sector} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold font-mono text-white group-hover:text-emerald-400 transition-colors">
                              {stock.symbol}
                            </span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#0b0f19] border border-[#1e293b] text-[#94a3b8]">
                              {stock.sector}
                            </span>
                          </div>
                          <div className="text-xs text-[#94a3b8] mt-0.5 line-clamp-1">
                            {stock.company_name}
                          </div>
                        </div>
                      </div>
                      <SignalBadge signal={signal} size="sm" />
                    </div>

                    {/* Pricing Row */}
                    <div className="mt-4 flex items-baseline justify-between border-t border-[#1e293b] pt-3">
                      <div>
                        <div className="text-[11px] text-[#64748b] uppercase">LAST TRADED PRICE</div>
                        <div className="text-lg font-bold text-white num-tabular">
                          {price > 0 ? formatINR(price) : '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-[#64748b] uppercase">NET 24H</div>
                        <div className={`text-xs font-bold flex items-center justify-end num-tabular ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {formatPercent(change)}
                        </div>
                      </div>
                    </div>

                    {/* Quantitative Stats Row */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1e293b] text-xs">
                      <div className="bg-[#0b0f19] p-2.5 rounded border border-[#1e293b]">
                        <span className="text-[#64748b] block text-[11px]">RSI (14D)</span>
                        <span className={`font-bold num-tabular ${rsi >= 70 ? 'text-rose-400' : rsi <= 30 ? 'text-emerald-400' : 'text-white'}`}>
                          {rsi.toFixed(1)}
                        </span>
                      </div>
                      <div className="bg-[#0b0f19] p-2.5 rounded border border-[#1e293b]">
                        <span className="text-[#64748b] block text-[11px]">VOL RATIO</span>
                        <span className={`font-bold num-tabular ${volRatio >= 1.5 ? 'text-amber-300' : 'text-white'}`}>
                          {volRatio.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/stock/${stock.symbol}`}
                    className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#94a3b8] group-hover:text-emerald-400 transition-colors font-medium"
                  >
                    <span>Open Deep Dive Intelligence</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <StockSearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
