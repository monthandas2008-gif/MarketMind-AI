'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Sparkles, Building2, ArrowRight, CornerDownLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { InstrumentSearchResult } from '@/lib/types';
import TrackButton from './TrackButton';
import { cn } from '@/lib/utils';

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SECTORS = ['All', 'Banking', 'IT', 'Auto', 'Energy', 'Pharma', 'FMCG', 'Defence', 'Metals'];

export default function StockSearchModal({ isOpen, onClose }: StockSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InstrumentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      search('');
    } else {
      setQuery('');
      setResults([]);
      setSelectedSector('All');
    }
  }, [isOpen]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const search = async (q: string) => {
    setLoading(true);
    try {
      const data = await api.searchInstruments(q);
      setResults(data);
      setSelectedIndex(0);
    } catch (err) {
      console.warn('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const filteredResults = selectedSector === 'All'
    ? results
    : results.filter((r) => r.sector.toLowerCase() === selectedSector.toLowerCase());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      e.preventDefault();
      const target = filteredResults[selectedIndex].symbol;
      onClose();
      router.push(`/stock/${target}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Indian Equities"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#111827] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-[#1e293b] bg-[#0b0f19]">
          <Search className="w-5 h-5 text-[#64748b] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search 50+ Indian Equities by symbol, company, or sector (e.g. TATA, HDFC, IT)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-[#64748b] focus:outline-none font-sans"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                search('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-[#64748b] hover:text-white hover:bg-[#162032]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#64748b] bg-[#162032] border border-[#1e293b] rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Sector Quick Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#1e293b] bg-[#0b0f19]/60 overflow-x-auto text-xs">
          <span className="text-[11px] text-[#64748b] uppercase tracking-wider mr-1">Sector:</span>
          {POPULAR_SECTORS.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0',
                selectedSector === sec
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#162032] text-[#94a3b8] hover:text-white hover:bg-[#1e293b] border border-transparent'
              )}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-[#1e293b]/60 flex-1">
          {loading ? (
            <div className="py-12 text-center text-[#64748b] text-xs">
              <Sparkles className="w-5 h-5 mx-auto mb-2 animate-pulse text-emerald-400" />
              Searching instrument directory...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-8 h-8 text-[#64748b] mx-auto mb-2 opacity-50" />
              <p className="text-[#cbd5e1] text-sm font-medium">No Indian equities found matching &quot;{query}&quot;</p>
              <p className="text-[#64748b] text-xs mt-1">Try searching by company name, sector or ticker.</p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.symbol}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'group flex items-center justify-between p-3 rounded-lg transition-all duration-150 cursor-pointer',
                    isSelected ? 'bg-[#162032] border border-[#293548]' : 'hover:bg-[#162032]/60 border border-transparent'
                  )}
                  onClick={() => {
                    onClose();
                    router.push(`/stock/${item.symbol}`);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center font-mono font-bold text-xs text-emerald-400 group-hover:border-emerald-500/40 transition-all shrink-0">
                      {item.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                          {item.symbol}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0b0f19] text-[#94a3b8] border border-[#1e293b]">
                          {item.sector}
                        </span>
                        <span className="text-[11px] text-[#64748b] hidden sm:inline">
                          {item.market_cap_category}
                        </span>
                      </div>
                      <p className="text-xs text-[#94a3b8] truncate mt-0.5">{item.company_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                    <TrackButton
                      symbol={item.symbol}
                      companyName={item.company_name}
                      sector={item.sector}
                      size="sm"
                    />
                    <Link
                      href={`/stock/${item.symbol}`}
                      onClick={onClose}
                      className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#0b0f19] transition-colors hidden sm:flex items-center"
                      title="Open Stock Analysis"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-[#1e293b] bg-[#0b0f19] flex items-center justify-between text-xs text-[#64748b]">
          <div className="flex items-center gap-2">
            <span>Tracking feeds into full 4-agent analysis</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-[#64748b]" /> to select
            </span>
            <span>Use ↑↓ to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
