'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { ShieldCheck, Play, Clock, AlertTriangle } from 'lucide-react';
import { requestTradeSafetyReview, TradeSafetyReviewResponse } from '@/lib/safety';
import SafetyReviewCard from '@/components/safety/SafetyReviewCard';

function SafetyPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TradeSafetyReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialTicker = searchParams.get('ticker') || '';

  const [form, setForm] = useState({
    ticker: initialTicker,
    direction: 'LONG' as 'LONG' | 'SHORT',
    entry_price: '',
    stop_loss: '',
    target: '',
    quantity: '',
    strategy: '',
    setup: '',
    notes: '',
    capital: '',
    risk_percent: ''
  });

  useEffect(() => {
    const qTicker = searchParams.get('ticker');
    if (qTicker) {
      setForm(prev => ({ ...prev, ticker: qTicker.toUpperCase() }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRunReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await requestTradeSafetyReview({
        ticker: form.ticker,
        direction: form.direction,
        entry_price: Number(form.entry_price),
        stop_loss: form.stop_loss ? Number(form.stop_loss) : undefined,
        target: form.target ? Number(form.target) : undefined,
        quantity: Number(form.quantity),
        strategy: form.strategy,
        setup: form.setup,
        notes: form.notes,
        capital: form.capital ? Number(form.capital) : undefined,
        risk_percent: form.risk_percent ? Number(form.risk_percent) : undefined,
        user_id: 'demo_user'
      });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred during safety review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Trader Safety Intelligence">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Trade Safety Review</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-4 bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">New Trade Plan</h2>
            <form onSubmit={handleRunReview} className="space-y-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Ticker</label>
                <input required type="text" name="ticker" value={form.ticker} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none" placeholder="e.g. RELIANCE" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Direction</label>
                  <select name="direction" value={form.direction} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none">
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Quantity</label>
                  <input required type="number" name="quantity" value={form.quantity} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Entry</label>
                  <input required type="number" step="0.05" name="entry_price" value={form.entry_price} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Stop Loss</label>
                  <input type="number" step="0.05" name="stop_loss" value={form.stop_loss} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Target</label>
                  <input type="number" step="0.05" name="target" value={form.target} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Capital (Optional)</label>
                  <input type="number" name="capital" value={form.capital} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Risk % (Optional)</label>
                  <input type="number" step="0.1" name="risk_percent" value={form.risk_percent} onChange={handleChange} className="w-full h-9 bg-[#111827] border border-[#1e293b] rounded-md text-white px-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {loading ? 'Consulting Intelligence Agents...' : 'Run Safety Review'}
              </button>
            </form>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="text-sm">{error}</div>
              </div>
            )}
            
            {loading && (
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                <Clock className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Analyzing Trade Plan</h3>
                <div className="text-sm text-[#94a3b8] text-center max-w-md">
                  Engaging Market Risk, Portfolio Risk, Trade Plan, News Evidence, and Behaviour agents...
                </div>
              </div>
            )}

            {!loading && result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SafetyReviewCard review={result} />
              </div>
            )}

            {!loading && !result && !error && (
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] text-[#94a3b8]">
                <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
                <p>Fill out the trade plan details and run a review.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function SafetyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">Loading Safety Intelligence...</div>}>
      <SafetyPageContent />
    </Suspense>
  );
}

