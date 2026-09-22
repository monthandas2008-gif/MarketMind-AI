import React from 'react';

interface SignalBadgeProps {
  signal?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SignalBadge({ signal = 'neutral', size = 'sm' }: SignalBadgeProps) {
  const s = signal.toLowerCase();

  const isBullish = s === 'bullish' || s === 'positive';
  const isBearish = s === 'bearish' || s === 'negative';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  if (isBullish) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded ${sizeClasses} bg-emerald-950/60 border border-emerald-500/30 text-emerald-400`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        BULLISH
      </span>
    );
  }

  if (isBearish) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded ${sizeClasses} bg-rose-950/60 border border-rose-500/30 text-rose-400`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        BEARISH
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded ${sizeClasses} bg-[#171c28] border border-[#222938] text-[#94a3b8]`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
      NEUTRAL
    </span>
  );
}
