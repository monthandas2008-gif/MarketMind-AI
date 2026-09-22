'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Cpu, ShieldCheck, Database, Activity, Terminal, Code2
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function IntelligenceArchitecturePage() {
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<{ title: string; json: string } | null>(null);

  const openSchema = (title: string, json: string) => {
    setSelectedSchema({ title, json });
    setSchemaModalOpen(true);
  };

  const pydanticSchemas = {
    technical: `{
  "agent_name": "Technical Analysis Desk",
  "symbol": "RELIANCE",
  "findings": "Price above 50 SMA (₹2,912.40). 14D RSI at 58.4 indicates bullish continuation without overbought exhaustion.",
  "signal": "bullish",
  "confidence": "high",
  "evidence": [
    {
      "claim": "Golden crossover confirmed on 20/50 SMA",
      "source": "NumPy Indicator Engine",
      "data_point": "SMA_20: 2940.10, SMA_50: 2912.40"
    }
  ]
}`,
    news: `{
  "agent_name": "News Intelligence Desk",
  "symbol": "RELIANCE",
  "findings": "Corporate announcements on green energy expansion corroborated by Economic Times reports.",
  "signal": "bullish",
  "confidence": "moderate",
  "evidence": [
    {
      "claim": "Consortium secures offshore solar manufacturing rights",
      "source": "Economic Times RSS",
      "source_url": "https://economictimes.indiatimes.com/markets/stocks/news/..."
    }
  ]
}`,
    anomaly: `{
  "agent_name": "Anomaly Detection Desk",
  "symbol": "RELIANCE",
  "findings": "Trading volume 1.18x over 20-day mean. No statistical volume spike (|z| < 2.0). Order flow nominal.",
  "signal": "neutral",
  "confidence": "high",
  "evidence": [
    {
      "claim": "Volume Z-Score at +0.42 sigma within normal Gaussian envelope",
      "source": "Z-Score Anomaly Detector",
      "data_point": "z_score: 0.42, volume_ratio: 1.18"
    }
  ]
}`,
    synthesis: `{
  "agent_name": "Lead Market Synthesis Agent",
  "symbol": "RELIANCE",
  "findings": "High conviction bullish posture verified across technical support levels and positive institutional news flow. Liquidity verified healthy with 0 volume anomalies.",
  "signal": "bullish",
  "confidence": "high",
  "evidence_strength": "strong",
  "evidence": [
    { "claim": "Technical SMA support verified", "source": "NumPy Indicator Engine" },
    { "claim": "Fundamental media catalyst verified", "source": "Economic Times RSS" }
  ]
}`
  };

  return (
    <AppShell>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                Multi-Agent Architecture & Provenance Trail
              </h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              End-to-end provenance: How raw ticks and financial news convert into mathematical indicators, specialized reasoning desks, and synthesized research briefs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="bullish">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" /> 4 Desks Synchronized
            </Badge>
            <Link href="/ask">
              <Button size="sm" className="text-xs font-semibold gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] h-8">
                <Terminal className="w-3.5 h-3.5" />
                <span>Open Terminal</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* WORKFLOW DIAGRAM */}
        <section className="bg-[#111827] rounded-xl p-6 border border-[#1e293b] space-y-6">
          <div className="border-b border-[#1e293b] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                End-to-End Intelligence Pipeline Flow
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Strictly hierarchical: Specialized sub-agents reason concurrently across isolated disciplines before lead synthesis verification.
              </p>
            </div>
            <Badge variant="default" className="hidden sm:inline-flex">
              DETERMINISTIC + REASONING
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            
            {/* Step 1 */}
            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between hover:border-[#334155] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                    STAGE 01
                  </span>
                  <Database className="w-4 h-4 text-[#64748b]" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase">Data Ingestion</h3>
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                  Connects to Yahoo Finance (OHLCV) and Google News RSS feeds for real-time tick & headline aggregation.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#1e293b] text-[11px] text-[#64748b]">
                yfinance • feedparser
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between hover:border-[#334155] transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/20">
                    STAGE 02
                  </span>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase">Deterministic Math</h3>
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                  Pre-calculates pure formulas: RSI(14), MACD, Bollinger Bands, and Volume Spikes via NumPy. Zero arithmetic hallucinations.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#1e293b] text-[11px] text-[#64748b]">
                NumPy • Pandas • ta library
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0b0f19] border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    STAGE 03
                  </span>
                  <Cpu className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase">Agent Reasoning Desks</h3>
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                  Three isolated agents (Technical Desk, News Desk, Anomaly Desk) analyze evidence with strict Pydantic JSON contracts.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#1e293b] text-[11px] text-emerald-400">
                Gemini 2.5 Flash • Structured
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#0b0f19] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    STAGE 04
                  </span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase">Lead Synthesis</h3>
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                  Cross-audits claims against verifiable citations, detects contradictions, and outputs an institutional executive research brief.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#1e293b] text-[11px] text-amber-300">
                Deterministic Provenance Ledger
              </div>
            </div>
          </div>
        </section>

        {/* AGENTS DIRECTORY & PYDANTIC CONTRACTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-white">
              Specialized Reasoning Desks Specifications
            </h2>
            <span className="text-xs text-[#64748b]">
              Click desk to inspect Pydantic JSON schema
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Desk */}
            <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-bold text-sm text-white">Technical Analysis Desk</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSchema('Technical Desk Schema', pydanticSchemas.technical)}
                  className="text-xs h-7 gap-1 border-[#1e293b] bg-[#0b0f19] text-[#94a3b8] hover:text-white"
                >
                  <Code2 className="w-3 h-3 text-cyan-400" /> Schema
                </Button>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Interprets pure mathematical signals computed by the deterministic indicator pipeline: 20/50/200 Day Moving Averages, RSI momentum divergence, MACD crossovers, and Support/Resistance boundaries.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#1e293b]">
                <div><span className="text-[#64748b]">Input:</span> <span className="text-white">OHLCV + Indicators</span></div>
                <div><span className="text-[#64748b]">Output:</span> <span className="text-white">Signal + Support/Res</span></div>
              </div>
            </div>

            {/* News Desk */}
            <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-sm text-white">News Intelligence Desk</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSchema('News Intelligence Desk Schema', pydanticSchemas.news)}
                  className="text-xs h-7 gap-1 border-[#1e293b] bg-[#0b0f19] text-[#94a3b8] hover:text-white"
                >
                  <Code2 className="w-3 h-3 text-emerald-400" /> Schema
                </Button>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Ingests live financial news feeds (Economic Times, Livemint, Business Standard). Evaluates corporate actions, quarterly earnings surprises, RBI regulatory policy shifts, and management guidance.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#1e293b]">
                <div><span className="text-[#64748b]">Input:</span> <span className="text-white">Headlines + Pub Dates</span></div>
                <div><span className="text-[#64748b]">Output:</span> <span className="text-white">Sentiment + Provenance</span></div>
              </div>
            </div>

            {/* Anomaly Desk */}
            <div className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-bold text-sm text-white">Anomaly Detection Desk</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSchema('Anomaly Desk Schema', pydanticSchemas.anomaly)}
                  className="text-xs h-7 gap-1 border-[#1e293b] bg-[#0b0f19] text-[#94a3b8] hover:text-white"
                >
                  <Code2 className="w-3 h-3 text-amber-400" /> Schema
                </Button>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Flags statistical outliers in trading activity: Z-score volume deviations, extreme price slippage, or decoupling between technical breakouts without corroborating fundamental news flow.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#1e293b]">
                <div><span className="text-[#64748b]">Method:</span> <span className="text-white">Volume Z-Score + ATR</span></div>
                <div><span className="text-[#64748b]">Alert Level:</span> <span className="text-white">Empirical Outlier</span></div>
              </div>
            </div>

            {/* Synthesis Desk */}
            <div className="bg-[#111827] rounded-xl p-5 border border-emerald-500/30 space-y-3 hover:border-emerald-400 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-sm text-white">Lead Market Synthesis Agent</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSchema('Lead Synthesis Schema', pydanticSchemas.synthesis)}
                  className="text-xs h-7 gap-1 border-emerald-500/30 bg-[#0b0f19] text-emerald-400"
                >
                  <Code2 className="w-3 h-3" /> Schema
                </Button>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Aggregates desk findings into an executive report. Audits every claim against ingested data points, highlights contradictions, and tags claims with verifiable source URLs and confidence levels.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#1e293b]">
                <div><span className="text-[#64748b]">Output:</span> <span className="text-white">Executive Thesis</span></div>
                <div><span className="text-[#64748b]">Rule:</span> <span className="text-emerald-400 font-semibold">Strict Provenance</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM GUARANTEES */}
        <section className="bg-[#111827] rounded-xl p-5 border border-[#1e293b] space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Institutional Architecture Principles & Verification Guardrails
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#94a3b8] pt-2">
            <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#1e293b]">
              <strong className="text-white block mb-1">1. Zero Fabrication Policy</strong>
              If an agent cannot corroborate a headline with an RSS URL or calculate an indicator with NumPy, the claim is rejected at the synthesis layer.
            </div>
            <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#1e293b]">
              <strong className="text-white block mb-1">2. Pydantic Schemas</strong>
              Every LLM call uses structured outputs (`response_schema`), guaranteeing that JSON keys match Python Pydantic models with 0 parsing failures.
            </div>
            <div className="bg-[#0b0f19] p-3.5 rounded-lg border border-[#1e293b]">
              <strong className="text-white block mb-1">3. Deterministic Indicators</strong>
              Mathematical indicators (RSI, Bollinger, MACD) are NEVER calculated by the LLM. They are computed in Python and passed as read-only grounding context.
            </div>
          </div>
        </section>
      </div>

      {/* Schema Inspector Dialog */}
      <Dialog open={schemaModalOpen} onOpenChange={setSchemaModalOpen}>
        <DialogContent className="max-w-xl bg-[#111827] border-[#1e293b]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>{selectedSchema?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <pre className="bg-[#0b0f19] p-4 rounded-lg border border-[#1e293b] text-xs font-mono text-emerald-400 overflow-x-auto max-h-[350px]">
            {selectedSchema?.json}
          </pre>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
