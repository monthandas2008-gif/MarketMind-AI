'use client';

import React from 'react';
import { Activity, Newspaper, AlertTriangle, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

interface AgentMeshNodeProps {
  activeTicker?: string;
  technicalSignal?: 'bullish' | 'neutral' | 'bearish';
  technicalDetail?: string;
  newsSummary?: string;
  newsSourcesCount?: number;
  anomalyStatus?: string;
  volumeRatio?: number;
  synthesisThesis?: string;
  synthesisConfidence?: string;
}

export default function AgentMeshNode({
  activeTicker = 'NIFTY 50 & EQUITIES',
  technicalSignal = 'bullish',
  technicalDetail = 'RSI 54.2 • EMA 20/50 Bullish Alignment',
  newsSummary = 'RBI Policy Stability • IT Cloud Billings Surge',
  newsSourcesCount = 4,
  anomalyStatus = 'Nominal Activity',
  volumeRatio = 1.15,
  synthesisThesis = 'Consolidated Multi-Agent Assessment: Positive continuation bias with controlled volatility.',
  synthesisConfidence = 'HIGH CONVICTION'
}: AgentMeshNodeProps) {
  return (
    <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-emerald-400 uppercase">
            AI Multi-Agent Live Mesh
          </span>
          <span className="text-xs text-[#94a3b8]">• Active Stream: {activeTicker}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#0b0f19] text-[#94a3b8] border border-[#1e293b]">
            Deterministic Provenance
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
            3 Desks Synchronized
          </span>
        </div>
      </div>

      {/* Grid: 3 Origin Nodes feeding into Synthesis Node */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative">
        {/* Left Col: 3 Specialized Desks (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {/* Node 1: Technical Desk */}
          <div className="bg-[#0b0f19] rounded-lg p-3.5 border-l-4 border-l-emerald-500 border border-[#1e293b] hover:border-[#334155] transition-all">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Technical Analysis Desk</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                {technicalSignal.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] pl-6 leading-relaxed">
              {technicalDetail}
            </p>
          </div>

          {/* Node 2: News Desk */}
          <div className="bg-[#0b0f19] rounded-lg p-3.5 border-l-4 border-l-cyan-500 border border-[#1e293b] hover:border-[#334155] transition-all">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Newspaper className="w-4 h-4 text-cyan-400" />
                <span>News Intelligence Desk</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 font-semibold">
                {newsSourcesCount} Verified Citations
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] pl-6 leading-relaxed">
              {newsSummary}
            </p>
          </div>

          {/* Node 3: Anomaly Desk */}
          <div className="bg-[#0b0f19] rounded-lg p-3.5 border-l-4 border-l-purple-500 border border-[#1e293b] hover:border-[#334155] transition-all">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2 text-white font-semibold">
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                <span>Anomaly Detection Desk</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] text-purple-300 bg-purple-950/60 border border-purple-500/30 font-semibold num-tabular">
                Vol: {volumeRatio.toFixed(2)}x
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] pl-6 leading-relaxed">
              {anomalyStatus} — Statistical volume & slippage check.
            </p>
          </div>
        </div>

        {/* Center Connection Indicator (Desktop) */}
        <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
          <div className="flex flex-col items-center gap-1 text-emerald-400/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <ArrowRight className="w-5 h-5 text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Right Col: Lead Synthesis Decision Node (4 cols) */}
        <div className="lg:col-span-4 bg-[#162032] border border-[#293548] rounded-xl p-4 space-y-3 relative">
          <div className="flex items-center justify-between border-b border-[#293548] pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Lead Synthesis Node</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {synthesisConfidence}
            </span>
          </div>

          <p className="text-xs text-[#e2e8f0] leading-relaxed">
            {synthesisThesis}
          </p>

          <div className="pt-2 border-t border-[#293548] flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Grounded In Evidence
            </span>
            <span className="num-tabular font-mono text-[10px]">Latency: 420ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}