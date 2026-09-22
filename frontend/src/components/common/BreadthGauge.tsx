'use client';

import React from 'react';

interface BreadthGaugeProps {
  advances?: number;
  declines?: number;
  title?: string;
  subtitle?: string;
}

export default function BreadthGauge({
  advances = 32,
  declines = 18,
  title = 'Market Breadth (NSE)',
  subtitle = 'Advance / Decline Distribution'
}: BreadthGaugeProps) {
  const total = advances + declines || 50;
  const advPct = Math.round((advances / total) * 100);

  // SVG semi-circle gauge calculation (from -180 deg to 0 deg)
  const radius = 64;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - (advPct / 100) * circumference;

  // Needle angle: 0% -> -90 deg, 100% -> 90 deg
  const needleAngle = -90 + (advPct / 100) * 180;

  return (
    <div className="bg-[#111827] rounded-xl p-4 border border-[#1e293b] flex flex-col justify-between items-center text-center relative overflow-hidden">
      <div className="w-full flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-white tracking-wide">{title}</span>
        <span className="text-emerald-400 font-semibold text-xs num-tabular">{advPct}% Bullish</span>
      </div>
      <p className="w-full text-left text-xs text-[#64748b] mb-2">{subtitle}</p>

      {/* SVG Semi-Circle Needle Gauge */}
      <div className="relative w-44 h-24 my-2 flex items-center justify-center">
        <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
          {/* Background Track (Decline Rose) */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.25"
          />
          {/* Active Track (Advance Emerald) */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="#10b981"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />

          {/* Needle */}
          <g transform={`translate(80, 80) rotate(${needleAngle})`}>
            <line x1="0" y1="0" x2="0" y2="-52" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="4" fill="#10b981" />
          </g>
        </svg>

        {/* Center Readout */}
        <div className="absolute bottom-0 text-center">
          <span className="text-base font-bold text-white num-tabular">{advances}</span>
          <span className="text-xs text-[#64748b]"> vs </span>
          <span className="text-base font-bold text-rose-400 num-tabular">{declines}</span>
        </div>
      </div>

      <div className="w-full pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-[#64748b]">
        <span>Advances: <strong className="text-emerald-400 num-tabular">{advances}</strong></span>
        <span>A/D Ratio: <strong className="text-white num-tabular">{(advances / Math.max(declines, 1)).toFixed(2)}</strong></span>
        <span>Declines: <strong className="text-rose-400 num-tabular">{declines}</strong></span>
      </div>
    </div>
  );
}