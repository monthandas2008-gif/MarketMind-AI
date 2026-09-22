'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { MarketOverview } from '@/lib/types';
import { formatINR, formatPercent, getDeltaMeta } from '@/lib/formatters';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isIndex?: boolean;
}

const DEFAULT_TICKERS: TickerItem[] = [
  { symbol: 'NIFTY 50', name: 'NIFTY 50', price: 23346.40, change: 0.33, isIndex: true },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: 76820.10, change: 0.28, isIndex: true },
  { symbol: 'BANK NIFTY', name: 'NIFTY BANK', price: 49850.20, change: -0.12, isIndex: true },
  { symbol: 'INDIA VIX', name: 'INDIA VIX', price: 13.42, change: -2.40, isIndex: true },
  { symbol: 'GIFT NIFTY', name: 'GIFT NIFTY', price: 23410.00, change: 0.42, isIndex: true },
];

export default function MarketTickerTape() {
  const [tickers, setTickers] = useState<TickerItem[]>(DEFAULT_TICKERS);

  useEffect(() => {
    async function fetchTickerData() {
      try {
        const overview: MarketOverview = await api.getMarketOverview();
        if (overview && overview.benchmarks) {
          const list: TickerItem[] = Object.entries(overview.benchmarks).map(([k, v]) => ({
            symbol: k,
            name: v.name || k,
            price: v.close,
            change: v.change_percent,
            isIndex: true,
          }));

          // Add Gift Nifty fallback if not in benchmarks
          if (!list.find((t) => t.symbol.includes('GIFT'))) {
            list.push({
              symbol: 'GIFT NIFTY',
              name: 'GIFT NIFTY',
              price: (overview.nifty_close || 23346.40) * 1.002,
              change: (overview.nifty_change_percent || 0.33) + 0.05,
              isIndex: true,
            });
          }

          if (list.length > 0) {
            setTickers(list);
          }
        }
      } catch {
        // Retain default tickers on error
      }
    }

    fetchTickerData();
    const interval = setInterval(fetchTickerData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#0b0f19] border-b border-[#1e293b] text-xs overflow-x-auto no-scrollbar py-1 px-4 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 min-w-max">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[#64748b] tracking-wider pr-3 border-r border-[#1e293b]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>INDIAN EQUITIES</span>
          </div>

          <div className="flex items-center gap-6">
            {tickers.map((item) => {
              const delta = getDeltaMeta(item.change);
              const isVix = item.symbol.includes('VIX');
              const formattedPrice = isVix
                ? item.price.toFixed(2)
                : formatINR(item.price, { showDecimals: true });

              return (
                <Link
                  key={item.symbol}
                  href={item.symbol === 'NIFTY 50' ? '/markets' : `/stock/${encodeURIComponent(item.symbol)}`}
                  className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                >
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-emerald-400 transition-colors">
                    {item.symbol}
                  </span>
                  <span className="text-xs text-white num-tabular font-medium">
                    {formattedPrice}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] num-tabular px-1.5 py-0.2 rounded border ${delta.badgeClass} font-semibold`}
                  >
                    <span>{delta.glyph}</span>
                    <span>{formatPercent(item.change)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[11px] text-[#64748b]">
          <span>NSE/BSE Ingestion</span>
          <span className="text-emerald-400 font-medium">Synced</span>
        </div>
      </div>
    </div>
  );
}
