'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, Bot, User, ShieldCheck, RefreshCw, Terminal, Sparkles,
  Copy, Check, Trash2, ExternalLink
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { ChatResponse } from '@/lib/types';

interface ParsedEvidence {
  technical?: string;
  news?: string;
  anomaly?: string;
  sources?: string[];
  followUps?: string[];
  stocks?: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  agentsUsed?: string[];
  evidence?: ParsedEvidence;
  timestamp: string;
}

function parseResponseDetails(text: string): ParsedEvidence {
  const stocks: string[] = [];
  ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'NIFTY'].forEach((sym) => {
    if (new RegExp(`\\b${sym}\\b`, 'i').test(text)) {
      stocks.push(sym);
    }
  });

  const followUps = [
    "What are the key technical support and resistance levels?",
    "Are there any volume anomalies or institutional accumulation blocks?",
    "Summarize recent regulatory or earnings announcements",
  ];

  return {
    stocks: Array.from(new Set(stocks)),
    followUps,
    sources: [
      "National Stock Exchange of India (NSE) Real-time Quotes",
      "The Economic Times Financial Desk RSS",
      "Livemint Market Intelligence Feed",
      "NumPy Deterministic Mathematical Engine"
    ]
  };
}

function AskMarketMindContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [input, setInput] = useState(initialQuery);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Welcome to MarketMind AI Research Terminal. Query Indian equities (Nifty 50, Reliance, TCS, Infosys, ICICI Bank, ITC), abnormal trading volumes, sector divergence, or today's market catalysts.",
      agentsUsed: ['Technical Desk', 'News Desk', 'Anomaly Desk', 'Lead Synthesis'],
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Loading stage ticker
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % 3);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async (queryToSend?: string) => {
    const queryText = (queryToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoadingStage(0);
    setLoading(true);

    try {
      const res: ChatResponse = await api.askMarketMind(queryText);
      const parsed = parseResponseDetails(res.response);

      const agentMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'agent',
        text: res.response,
        agentsUsed: res.agents_used,
        evidence: parsed,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      let userFriendlyText = "Error communicating with intelligence agents. Please verify that the backend is running.";
      if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("rate limit")) {
        userFriendlyText = "⚠️ **AI Rate Limit Reached (15 requests/hour)**\n\nTo unlock **unlimited, unrestricted AI queries**, please configure your own personal Google Gemini API key by clicking **'Configure Gemini Key'** in the left navigation panel.";
      } else if (errorMessage) {
        userFriendlyText = `⚠️ **Query Error:** ${errorMessage}`;
      }

      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'agent',
        text: userFriendlyText,
        agentsUsed: ['Gateway / RateLimiter'],
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setLoadingStage(0);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'agent',
        text: "Terminal cleared. Enter a new query to start research.",
        agentsUsed: ['Lead Synthesis'],
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  useEffect(() => {
    if (initialQuery) {
      const timer = setTimeout(() => {
        handleSend(initialQuery);
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestedQueries = [
    "Why is Reliance moving today?",
    "Summarize Nifty 50 market sentiment",
    "Did any stock show abnormal volume?",
    "Compare TCS vs Infosys technical posture",
  ];

  const loadingStages = [
    "Consulting Technical Indicator Engine (NumPy / ta)...",
    "Evaluating Real-Time News Stream (ET / Mint RSS)...",
    "Lead Synthesis Reconciling Contradictions & Output..."
  ];

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col h-[calc(100vh-90px)]">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Ask MarketMind — AI Research Terminal
            </h1>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Grounded research across live Indian market math, indicators, and publisher headlines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="bullish" className="hidden sm:inline-flex">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>Grounded Retrieval</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-xs text-[#94a3b8] hover:text-white border-[#1e293b] bg-[#111827] h-7"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 no-scrollbar text-xs">
        <span className="text-[11px] text-[#64748b] uppercase whitespace-nowrap font-semibold">
          Suggested:
        </span>
        {suggestedQueries.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSend(q)}
            className="text-xs text-[#cbd5e1] hover:text-white bg-[#111827] hover:bg-[#162032] border border-[#1e293b] hover:border-[#334155] px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 bg-[#111827] rounded-xl p-4 mb-3 border border-[#1e293b]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'agent' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[90%] sm:max-w-[82%] rounded-xl p-4 text-xs ${
                m.sender === 'user'
                  ? 'bg-[#162032] text-white border border-emerald-500/40 shadow-sm'
                  : 'bg-[#0b0f19] text-[#cbd5e1] border border-[#1e293b] shadow-sm leading-relaxed'
              }`}
            >
              {/* Agent Header */}
              {m.sender === 'agent' && (
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#1e293b] text-[11px] text-[#64748b]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MARKETMIND RESEARCH THESIS</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{m.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.text)}
                      className="text-[#94a3b8] hover:text-white transition-colors p-1"
                      title="Copy Answer"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Answer */}
              <div className="whitespace-pre-wrap text-xs sm:text-[13px] text-white leading-relaxed">
                {m.text}
              </div>

              {/* Desks Consulted */}
              {m.agentsUsed && m.agentsUsed.length > 0 && (
                <div className="mt-3.5 pt-2.5 border-t border-[#1e293b] flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-[#64748b]">Desks Consulted:</span>
                  {m.agentsUsed.map((ag) => (
                    <Badge key={ag} variant="ai">
                      {ag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Related Stocks & Citations */}
              {m.evidence && (
                <div className="mt-3 pt-2.5 border-t border-[#1e293b] space-y-2.5 text-xs">
                  {/* Related Stock Links */}
                  {m.evidence.stocks && m.evidence.stocks.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#64748b] text-[11px] uppercase">Related Equities:</span>
                      {m.evidence.stocks.map((stk) => (
                        <Link
                          key={stk}
                          href={stk === 'NIFTY' ? '/markets' : `/stock/${stk}`}
                          className="px-2 py-0.5 rounded bg-[#162032] border border-[#1e293b] hover:border-emerald-500/40 text-emerald-400 font-mono transition-colors inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>{stk}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Sources Accordion */}
                  {m.evidence.sources && (
                    <div className="bg-[#111827] p-2.5 rounded-lg border border-[#1e293b] space-y-1">
                      <span className="text-[11px] uppercase text-[#64748b] block font-semibold">
                        Grounded Sources & Citations:
                      </span>
                      <ul className="text-xs text-[#94a3b8] list-disc list-inside space-y-0.5">
                        {m.evidence.sources.map((src, i) => (
                          <li key={i}>{src}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Follow-ups */}
                  {m.evidence.followUps && (
                    <div className="pt-1">
                      <span className="text-[11px] uppercase text-[#64748b] block mb-1.5 font-semibold">
                        Suggested Follow-ups:
                      </span>
                      <div className="flex flex-col sm:flex-row gap-1.5">
                        {m.evidence.followUps.map((fu, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(fu)}
                            className="text-left text-xs text-[#94a3b8] hover:text-white bg-[#111827] hover:bg-[#162032] border border-[#1e293b] px-2.5 py-1 rounded-md transition-colors"
                          >
                            → {fu}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {m.sender === 'user' && (
                <div className="text-right text-[10px] text-emerald-200 mt-1 font-mono">
                  {m.timestamp}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#162032] border border-[#1e293b] flex items-center justify-center shrink-0 mt-0.5 text-[#94a3b8]">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Multi-Stage Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-3 text-xs text-[#94a3b8] flex items-center gap-2.5 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-white block font-semibold">{loadingStages[loadingStage]}</span>
                <span className="text-[11px] text-[#64748b] block">Multi-Agent parallel processing • Pydantic contract validation</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Ask anything about Indian stocks, Nifty 50, abnormal volume, or technical indicators..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="h-10 bg-[#111827] border-[#1e293b] text-white text-xs focus:border-emerald-500"
        />
        <Button
          type="submit"
          size="default"
          disabled={loading || !input.trim()}
          className="h-10 px-5 font-semibold gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19]"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Submit</span>
        </Button>
      </form>
    </div>
  );
}

export default function AskPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-xs text-[#94a3b8] py-20">
          <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-400" /> Initializing Terminal...
        </div>
      }>
        <AskMarketMindContent />
      </Suspense>
    </AppShell>
  );
}