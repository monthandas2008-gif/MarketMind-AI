'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { useWatchlist } from '@/lib/watchlist';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface WatchlistButtonProps {
  symbol: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function WatchlistButton({ symbol, size = 'sm', className = '' }: WatchlistButtonProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const active = isInWatchlist(symbol);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const btnPadding = size === 'sm' ? 'p-1.5' : 'p-2';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(symbol);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            aria-label={active ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
            className={`inline-flex items-center justify-center rounded transition-colors ${btnPadding} ${
              active
                ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
                : 'text-[#64748b] hover:text-white hover:bg-[#162035] border border-transparent'
            } ${className}`}
          >
            <Star className={`${iconSize} ${active ? 'fill-amber-400' : ''}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {active ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
