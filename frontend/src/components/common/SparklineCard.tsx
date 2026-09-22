'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SparklineCardProps {
  title: string;
  ticker: string;
  value: number;
  change: number;
  prefix?: string;
  high?: number;
  low?: number;
  sparklineData?: number[];
}

export default function SparklineCard({
  title,
  ticker,
  value,
  change,
  prefix = '₹',
  high,
  low,
  sparklineData = [20, 25, 22, 28, 32, 30, 38, 42, 40, 48, 55],
}: SparklineCardProps) {
  const isPositive = change >= 0;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillGradientId = `grad-${title.replace(/[\s^]+/g, '-')}`;

  // Normalize points into SVG path string
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 160;
  const height = 44;

  const points = sparklineData.map((d, idx) => {
    const x = (idx / (sparklineData.length - 1)) * width;
    const y = height - ((d - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="bg-[#111827] hover:bg-[#162032] rounded-xl p-4 border border-[#1e293b] hover:border-[#334155] transition-all">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="font-semibold text-white tracking-wide">{title}</span>
        <span className="text-[#64748b] text-[11px] font-mono">{ticker}</span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xl font-bold text-white num-tabular tracking-tight">
          {prefix}{value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </div>
        <div className={`text-xs font-semibold num-tabular flex items-center px-1.5 py-0.5 rounded border ${
          isPositive 
            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' 
            : 'text-rose-400 bg-rose-950/40 border-rose-500/30'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
          {isPositive ? '+' : ''}{change?.toFixed(2)}%
        </div>
      </div>

      {/* Crisp FinTech Vector Sparkline */}
      <div className="h-10 w-full my-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-hidden">
          <defs>
            <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${fillGradientId})`} />
          <path 
            d={pathD} 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="1.75" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {/* Range Info */}
      <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-[#64748b]">
        <span>H: <strong className="text-[#cbd5e1] num-tabular">{high ? `${prefix}${high.toLocaleString('en-IN')}` : 'Day High'}</strong></span>
        <span>L: <strong className="text-[#cbd5e1] num-tabular">{low ? `${prefix}${low.toLocaleString('en-IN')}` : 'Day Low'}</strong></span>
      </div>
    </div>
  );
}