'use client';

import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useTracking } from '@/lib/tracking';
import { cn } from '@/lib/utils';

interface TrackButtonProps {
  symbol: string;
  companyName?: string;
  sector?: string;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'outline' | 'ghost' | 'glass';
  showText?: boolean;
  className?: string;
}

export default function TrackButton({
  symbol,
  companyName,
  sector,
  size = 'default',
  variant = 'outline',
  showText = true,
  className = '',
}: TrackButtonProps) {
  const { isTracked, track, untrack } = useTracking();
  const [busy, setBusy] = useState(false);
  const tracked = isTracked(symbol);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    setBusy(true);
    try {
      if (tracked) {
        await untrack(symbol);
      } else {
        await track(symbol, companyName, sector);
      }
    } finally {
      setBusy(false);
    }
  };

  const isIconOnly = size === 'icon' || !showText;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={tracked ? `Tracking ${symbol} — click to untrack` : `Track ${symbol} in MarketMind`}
      className={cn(
        'group inline-flex items-center justify-center font-mono font-medium transition-all duration-200 select-none disabled:opacity-50 cursor-pointer',
        isIconOnly ? 'rounded-lg p-1.5' : 'rounded-lg px-2.5 py-1 text-xs gap-1.5',
        tracked
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30'
          : variant === 'ghost'
          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
          : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/60 shadow-sm',
        className
      )}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
      ) : tracked ? (
        <>
          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:hidden transition-transform" />
          <Bookmark className="w-3.5 h-3.5 text-rose-400 hidden group-hover:block transition-transform" />
          {!isIconOnly && (
            <span>
              <span className="group-hover:hidden">Tracked</span>
              <span className="hidden group-hover:inline">Untrack</span>
            </span>
          )}
        </>
      ) : (
        <>
          <Bookmark className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
          {!isIconOnly && <span>Track</span>}
        </>
      )}
    </button>
  );
}
