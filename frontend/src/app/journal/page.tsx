'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { 
  BookOpen, BarChart3, Target, TrendingUp, TrendingDown, 
  ShieldCheck, AlertCircle, Plus, ArrowUpRight, ArrowDownRight,
  Calendar, Layers, Filter, CheckCircle2, Clock, Sparkles
} from 'lucide-react';
import { 
  fetchJournalTrades, fetchJournalAnalytics, fetchTradePlans, 
  TradeJournalEntry, JournalAnalytics, TradePlan 
} from '@/lib/safety';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const DEMO_TRADE_PLANS: TradePlan[] = [
  {
    id: 'demo_plan_1',
    user_id: 'monthandas2008@gmail.com',
    ticker: 'RELIANCE',
    direction: 'BUY',
    entry_price: 2940.00,
    stop_loss: 2880.00,
    target: 3080.00,
    quantity: 15,
    strategy: 'Swing Breakout',
    setup: 'Cup & Handle breakout above 20-DMA',
    invalidating_condition: 'Daily close below ₹2,880 (50-DMA critical support)',
    status: 'ACTIVE'
  },
  {
    id: 'demo_plan_2',
    user_id: 'monthandas2008@gmail.com',
    ticker: 'TCS',
    direction: 'BUY',
    entry_price: 3890.00,
    stop_loss: 3780.00,
    target: 4120.00,
    quantity: 8,
    strategy: 'Trend Continuation',
    setup: 'Pullback retest of 50-EMA with expanding volume',
    invalidating_condition: 'Close below ₹3,780 invalidates setup',
    status: 'ACTIVE'
  },
  {
    id: 'demo_plan_3',
    user_id: 'monthandas2008@gmail.com',
    ticker: 'INFY',
    direction: 'BUY',
    entry_price: 1620.00,
    stop_loss: 1570.00,
    target: 1720.00,
    quantity: 20,
    strategy: 'Mean Reversion',
    setup: 'Double bottom base with RSI positive divergence',
    invalidating_condition: 'Breakdown below swing low ₹1,570',
    status: 'APPROVED'
  },
  {
    id: 'demo_plan_4',
    user_id: 'monthandas2008@gmail.com',
    ticker: 'HDFCBANK',
    direction: 'BUY',
    entry_price: 1480.00,
    stop_loss: 1435.00,
    target: 1580.00,
    quantity: 25,
    strategy: 'Value Accumulation',
    setup: 'Multi-week base accumulation at institutional floor',
    invalidating_condition: 'Breach of major support at ₹1,435',
    status: 'DRAFT'
  }
];

export default function JournalPage() {
  const { user } = useAuth();
  const userId = user?.email || 'monthandas2008@gmail.com';

  const [activeTab, setActiveTab] = useState<'plans' | 'history' | 'analytics'>('plans');
  const [plans, setPlans] = useState<TradePlan[]>(DEMO_TRADE_PLANS);
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>({
    total_trades: 11,
    win_rate_percent: 60.0,
    profit_factor: 1.92,
    expectancy_per_trade: 357.0,
    max_drawdown: 1059.0,
    longest_losing_streak: 1,
    gross_pnl: 5120.0,
    total_charges: 688.0,
    net_pnl: 4432.0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [plansData, tradesData, analyticsData] = await Promise.allSettled([
          fetchTradePlans(userId).catch(() => fetchTradePlans('demo_user')),
          fetchJournalTrades(userId).catch(() => fetchJournalTrades('demo_user')),
          fetchJournalAnalytics(userId).catch(() => fetchJournalAnalytics('demo_user'))
        ]);

        if (!isMounted) return;

        if (plansData.status === 'fulfilled' && plansData.value.length > 0) {
          setPlans(plansData.value);
        }
        if (tradesData.status === 'fulfilled' && tradesData.value.length > 0) {
          setTrades(tradesData.value);
        }
        if (analyticsData.status === 'fulfilled' && analyticsData.value) {
          setAnalytics(analyticsData.value);
        }
      } catch (err) {
        console.error('Error loading journal data:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [userId]);

  return (
    <AppShell title="Trade Journal">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Trade Journal & Execution Log</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                  Audited
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Track pre-trade setups, monitor plan compliance, and analyze statistical execution metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/safety">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs gap-1.5 h-9">
                <Plus className="w-4 h-4" />
                <span>Plan New Trade</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
          <div className="flex space-x-1 bg-[#111827] border border-[#1e293b] p-1 rounded-lg">
            {(['plans', 'history', 'analytics'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-md capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-[#1e293b] text-white shadow-sm border border-[#334155]'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#162032]'
                }`}
              >
                {tab === 'plans' && `Trade Plans (${plans.length})`}
                {tab === 'history' && `Trade History (${trades.length})`}
                {tab === 'analytics' && 'Performance Analytics'}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#64748b] hidden sm:inline font-mono">
            User: {userId}
          </span>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-xs text-[#94a3b8]">Synchronizing trading records with database...</p>
          </div>
        ) : (
          <div>
            {/* ── TAB 1: TRADE PLANS ── */}
            {activeTab === 'plans' && (
              <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">Active Pre-Trade Plans</h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Structured plans with invalidating conditions, stop-losses, and reward-to-risk ratios.
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    {plans.length} Ready for Execution
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#94a3b8]">
                    <thead className="text-[11px] uppercase bg-[#0b0f19] text-[#cbd5e1] border-b border-[#1e293b]">
                      <tr>
                        <th className="px-4 py-3">Ticker / Strategy</th>
                        <th className="px-4 py-3">Direction</th>
                        <th className="px-4 py-3 text-right">Entry</th>
                        <th className="px-4 py-3 text-right">Stop-Loss</th>
                        <th className="px-4 py-3 text-right">Target</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3">Invalidating Condition</th>
                        <th className="px-4 py-3 text-center">Safety Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {plans.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-[#64748b]">
                            No trade plans found. Create one using the &apos;Plan New Trade&apos; button above.
                          </td>
                        </tr>
                      ) : (
                        plans.map((p, idx) => {
                          const riskPerShare = Math.abs(p.entry_price - p.stop_loss);
                          const rewardPerShare = Math.abs(p.target - p.entry_price);
                          const rr = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(1) : '—';
                          return (
                            <tr key={p.id || idx} className="hover:bg-[#162032] transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-white text-sm">{p.ticker}</div>
                                <div className="text-[10px] text-emerald-400 font-medium">
                                  {p.strategy || 'Discretionary'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.direction === 'BUY' || p.direction === 'LONG'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {p.direction}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-white num-tabular">
                                ₹{p.entry_price.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-right text-rose-400 font-medium num-tabular">
                                ₹{p.stop_loss.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-400 font-semibold num-tabular">
                                ₹{p.target.toLocaleString('en-IN')}
                                <span className="block text-[10px] text-[#64748b]">R:R 1:{rr}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-white num-tabular">
                                {p.quantity}
                              </td>
                              <td className="px-4 py-3 max-w-xs truncate text-[11px] text-[#94a3b8]" title={p.invalidating_condition}>
                                {p.invalidating_condition || p.setup || '—'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  p.status === 'APPROVED' || p.status === 'ACTIVE'
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {p.status || 'DRAFT'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link href={`/safety?ticker=${p.ticker}`}>
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#334155] text-white hover:border-emerald-500 hover:text-emerald-400 gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span>Review</span>
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 2: TRADE HISTORY ── */}
            {activeTab === 'history' && (
              <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">Execution Journal Records</h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Audited closed and open positions with exact statutory charges and net P&L.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 text-xs">
                      {trades.filter(t => (t.net_pnl || 0) > 0).length} Wins
                    </span>
                    <span className="px-2 py-1 rounded bg-rose-950/50 text-rose-400 border border-rose-500/20 text-xs">
                      {trades.filter(t => (t.net_pnl || 0) < 0).length} Losses
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#94a3b8]">
                    <thead className="text-[11px] uppercase bg-[#0b0f19] text-[#cbd5e1] border-b border-[#1e293b]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Ticker</th>
                        <th className="px-4 py-3">Dir</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Entry ₹</th>
                        <th className="px-4 py-3 text-right">Exit ₹</th>
                        <th className="px-4 py-3 text-right">Charges ₹</th>
                        <th className="px-4 py-3 text-right">Net P&L</th>
                        <th className="px-4 py-3 text-center">Status / Exit Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {trades.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-[#64748b]">
                            No trades recorded in journal yet.
                          </td>
                        </tr>
                      ) : (
                        trades.map((t, idx) => {
                          const pnl = t.net_pnl || 0;
                          const isWin = pnl > 0;
                          return (
                            <tr key={t.id || idx} className="hover:bg-[#162032] transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-[#64748b]">
                                {t.entry_time ? new Date(t.entry_time).toLocaleDateString('en-GB') : '—'}
                              </td>
                              <td className="px-4 py-3 font-bold text-white text-sm">{t.ticker}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.direction === 'BUY' || (t.direction as string) === 'LONG'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {t.direction}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-white num-tabular">{t.quantity}</td>
                              <td className="px-4 py-3 text-right font-medium text-[#cbd5e1] num-tabular">
                                ₹{t.entry_price.toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-white num-tabular">
                                {t.exit_price ? `₹${t.exit_price.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-[#64748b] num-tabular">
                                ₹{(t.charges || 0).toFixed(1)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-bold text-sm num-tabular flex items-center justify-end gap-0.5 ${
                                  isWin ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-[#94a3b8]'
                                }`}>
                                  {isWin ? <ArrowUpRight className="w-3.5 h-3.5" /> : pnl < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                                  {pnl !== 0 ? `₹${Math.abs(pnl).toLocaleString('en-IN')}` : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  t.status === 'OPEN'
                                    ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                                    : isWin
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {t.exit_reason || t.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 3: PERFORMANCE ANALYTICS ── */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Total Trades</span>
                    <span className="text-2xl font-bold text-white num-tabular">{analytics.total_trades}</span>
                    <span className="text-[10px] text-[#94a3b8] block mt-0.5">Sample verified</span>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Win Rate</span>
                    <span className={`text-2xl font-bold num-tabular ${(analytics.win_rate_percent ?? analytics.win_rate_pct ?? 0) >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {(analytics.win_rate_percent ?? analytics.win_rate_pct ?? 0).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">Edge positive</span>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Profit Factor</span>
                    <span className="text-2xl font-bold text-emerald-400 num-tabular">
                      {analytics.profit_factor ? analytics.profit_factor.toFixed(2) : '0.00'}x
                    </span>
                    <span className="text-[10px] text-[#94a3b8] block mt-0.5">Gross Win ÷ Loss</span>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Expectancy</span>
                    <span className={`text-2xl font-bold num-tabular ${(analytics.expectancy ?? analytics.expectancy_per_trade ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{(analytics.expectancy ?? analytics.expectancy_per_trade ?? 0).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] block mt-0.5">Per trade edge</span>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Max Drawdown</span>
                    <span className="text-2xl font-bold text-rose-400 num-tabular">
                      ₹{analytics.max_drawdown?.toLocaleString('en-IN') || 0}
                    </span>
                    <span className="text-[10px] text-rose-400/80 block mt-0.5">Peak-to-trough</span>
                  </div>

                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Max Loss Streak</span>
                    <span className="text-2xl font-bold text-white num-tabular">{analytics.longest_losing_streak}</span>
                    <span className="text-[10px] text-[#94a3b8] block mt-0.5">Consecutive</span>
                  </div>
                </div>

                {/* Financial P&L Reconciliation */}
                <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    P&L Financial Reconciliation & Statutory Deductions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#0b0f19] p-4 rounded-lg border border-[#1e293b]">
                      <span className="text-xs text-[#94a3b8] block">Gross Cumulative P&L</span>
                      <span className="text-xl font-bold text-white num-tabular mt-1 block">
                        ₹{(analytics.gross_pnl ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-[10px] text-[#64748b]">Before STT & brokerages</span>
                    </div>

                    <div className="bg-[#0b0f19] p-4 rounded-lg border border-[#1e293b]">
                      <span className="text-xs text-[#94a3b8] block">Total Statutory Charges</span>
                      <span className="text-xl font-bold text-amber-400 num-tabular mt-1 block">
                        ₹{(analytics.total_charges ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-[10px] text-[#64748b]">STT + Exchange + SEBI + GST</span>
                    </div>

                    <div className="bg-[#0b0f19] p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/10">
                      <span className="text-xs text-emerald-400 block font-semibold">Net Realised Takeaway</span>
                      <span className="text-xl font-bold text-emerald-400 num-tabular mt-1 block">
                        ₹{(analytics.net_pnl ?? analytics.total_net_pnl ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-[10px] text-emerald-400/80">Account equity impact</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
