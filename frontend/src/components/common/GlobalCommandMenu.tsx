'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Cpu, FileText, Terminal, Layers, 
  ShieldCheck, Key, RefreshCw, BarChart2 
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { api } from '@/lib/api';

interface GlobalCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenGeminiModal?: () => void;
}

interface StockItem {
  symbol: string;
  name: string;
  sector: string;
}

const DEFAULT_STOCKS: StockItem[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Technology' },
  { symbol: 'INFY', name: 'Infosys Limited', sector: 'Technology' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Financials' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Financials' },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financials' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom' },
  { symbol: 'LT', name: 'Larsen & Toubro Limited', sector: 'Capital Goods' },
];

export default function GlobalCommandMenu({
  open,
  onOpenChange,
  onOpenGeminiModal,
}: GlobalCommandMenuProps) {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockItem[]>(DEFAULT_STOCKS);

  useEffect(() => {
    async function loadStocks() {
      try {
        const data = await api.getStocks();
        if (data && data.length > 0) {
          const mapped: StockItem[] = data.map((s) => ({
            symbol: s.symbol,
            name: s.company_name || s.symbol,
            sector: s.sector || 'General',
          }));
          setStocks(mapped);
        }
      } catch {
        // Fallback to default stocks list
      }
    }
    loadStocks();
  }, []);

  const navigateTo = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search stocks, indices, agents, pages... (e.g. RELIANCE, NIFTY, /ask)" />
      <CommandList>
        <CommandEmpty>No matching assets or terminal commands found.</CommandEmpty>

        {/* Indian Equity Universe */}
        <CommandGroup heading="Indian Equities & Benchmarks">
          {stocks.map((stock) => (
            <CommandItem
              key={stock.symbol}
              value={`${stock.symbol} ${stock.name}`}
              onSelect={() => navigateTo(`/stock/${stock.symbol}`)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                  {stock.symbol.slice(0, 1)}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">{stock.symbol}</span>
                  <span className="text-[10px] text-[#94a3b8]">
                    {stock.name} • {stock.sector}
                  </span>
                </div>
              </div>
              <CommandShortcut>NSE</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Terminal Workspaces */}
        <CommandGroup heading="Institutional Terminal Pages">
          <CommandItem onSelect={() => navigateTo('/dashboard')}>
            <TrendingUp className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Market Overview Dashboard</span>
            <CommandShortcut>G then D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/markets')}>
            <BarChart2 className="mr-2 h-4 w-4 text-cyan-400" />
            <span>Markets Terminal & Heatmap</span>
            <CommandShortcut>G then M</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/stocks')}>
            <Layers className="mr-2 h-4 w-4 text-indigo-400" />
            <span>Equity Screener Universe</span>
            <CommandShortcut>G then S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/intelligence')}>
            <Cpu className="mr-2 h-4 w-4 text-violet-400" />
            <span>Multi-Agent Live Mesh & Provenance</span>
            <CommandShortcut>G then I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/ask')}>
            <Terminal className="mr-2 h-4 w-4 text-amber-400" />
            <span>Ask MarketMind Conversational Terminal</span>
            <CommandShortcut>G then A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/reports')}>
            <FileText className="mr-2 h-4 w-4 text-rose-400" />
            <span>Daily Intelligence Memos</span>
            <CommandShortcut>G then R</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Terminal Actions">
          {onOpenGeminiModal && (
            <CommandItem
              onSelect={() => {
                onOpenChange(false);
                onOpenGeminiModal();
              }}
            >
              <Key className="mr-2 h-4 w-4 text-amber-400" />
              <span>Configure Gemini API Key</span>
            </CommandItem>
          )}
          <CommandItem onSelect={() => navigateTo('/reports')}>
            <RefreshCw className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Generate Fresh Daily Research Memo</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/ask?q=Identify%20unusual%20volume%20spikes%20in%20NIFTY%2050')}>
            <ShieldCheck className="mr-2 h-4 w-4 text-cyan-400" />
            <span>Scan Anomaly Desk for Volume Spikes</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
