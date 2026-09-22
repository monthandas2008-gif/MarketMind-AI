'use client';

import React, { useState } from 'react';
import { Send, Bot, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CopilotDockProps {
  onSymbolSelect?: (symbol: string) => void;
}

export default function CopilotDock({ onSymbolSelect }: CopilotDockProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(
    "MarketMind AI Copilot active. Ingesting live tick data for Nifty 50 and Indian bluechips. Ask any question or click an active chip below."
  );
  const [desksUsed, setDesksUsed] = useState<string[]>(['Technical', 'News', 'Synthesis']);

  const chips = [
    { label: 'Technical: RSI 46 Support', query: 'Analyze RSI and moving average support for NIFTY', symbol: 'NIFTY50' },
    { label: 'News: Corporate Actions', query: 'What are the main news catalysts for Indian IT?', symbol: 'TCS' },
    { label: 'Anomaly: RELIANCE Volume', query: 'Did Reliance show any abnormal volume spikes today?', symbol: 'RELIANCE' },
  ];

  const handleAsk = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await api.askMarketMind(q);
      setResponse(res.response);
      setDesksUsed(res.agents_used || ['Technical', 'News']);
    } catch {
      setResponse("Intelligence desk could not complete the query. Verify Gemini API key in the top nav.");
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (c: { label: string; query: string; symbol: string }) => {
    setQuery(c.query);
    handleAsk(c.query);
    if (onSymbolSelect) {
      onSymbolSelect(c.symbol);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-[#1a2333] flex flex-col justify-between h-full shadow-2xl relative overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a2333] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                AI Copilot Research Dock
              </h3>
              <p className="text-[10px] text-[#64748b] font-mono">Grounded Multi-Agent Retrieval</p>
            </div>
          </div>
          <Badge variant="bullish">
            <ShieldCheck className="w-3 h-3 mr-1" /> Grounded
          </Badge>
        </div>

        {/* Dynamic Activity Chips */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider block">
            Live Agent Activity Chips:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => handleChipClick(c)}
                className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#101624] hover:bg-[#162033] border border-[#1a2333] hover:border-emerald-500/40 text-[#cbd5e1] hover:text-white transition-all flex items-center gap-1.5 text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat / Findings Output Box */}
        <div className="bg-[#070a10] border border-[#1a2333] rounded-xl p-3 text-xs leading-relaxed max-h-48 overflow-y-auto mb-3">
          {loading ? (
            <div className="flex items-center gap-2 text-[#94a3b8] font-mono py-4 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Agents reasoning across technical, news & anomaly desks...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[#cbd5e1] font-sans whitespace-pre-wrap">{response}</p>
              {desksUsed && (
                <div className="pt-2 border-t border-[#1a2333] flex items-center gap-1.5 text-[10px] font-mono text-[#64748b]">
                  <span>Active Desks:</span>
                  {desksUsed.map((d) => (
                    <Badge key={d} variant="ai">
                      {d}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input query field */}
      <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex items-center gap-2 pt-2 border-t border-[#1a2333]">
        <Input
          type="text"
          placeholder="Ask Copilot about Indian market setups or stocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="flex-1 bg-[#070a10] border-[#1a2333]"
        />
        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={loading || !query.trim()}
          className="px-3"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}