'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { BookOpen, BarChart3, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchJournalTrades, fetchJournalAnalytics, TradeJournalEntry, JournalAnalytics } from '@/lib/safety';

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'history' | 'analytics'>('history');
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = 'demo_user';

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [tradesData, analyticsData] = await Promise.all([
          fetchJournalTrades(userId),
          fetchJournalAnalytics(userId)
        ]);
        setTrades(tradesData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error loading journal data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  return (
    <AppShell title="Trade Journal">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Trade Journal</h1>
        </div>

        {/* Tab Bar */}
        <div className="flex space-x-1 bg-[#111827] border border-[#1e293b] p-1 rounded-lg mb-6 w-max">
          {(['plans', 'history', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-[#1e293b] text-white shadow'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#162032]'
              }`}
            >
              {tab === 'plans' && 'Trade Plans'}
              {tab === 'history' && 'Trade History'}
              {tab === 'analytics' && 'Analytics'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-[#94a3b8] text-sm animate-pulse">Loading journal data...</div>
        ) : (
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
            {activeTab === 'plans' && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Saved Trade Plans</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#94a3b8]">
                    <thead className="text-xs uppercase bg-[#111827] text-[#cbd5e1]">
                      <tr>
                        <th className="px-4 py-3">Ticker</th>
                        <th className="px-4 py-3">Direction</th>
                        <th className="px-4 py-3">Entry</th>
                        <th className="px-4 py-3">Stop</th>
                        <th className="px-4 py-3">Target</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center">No trade plans found.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Recorded Trades</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#94a3b8]">
                    <thead className="text-xs uppercase bg-[#111827] text-[#cbd5e1]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Ticker</th>
                        <th className="px-4 py-3">Dir</th>
                        <th className="px-4 py-3">Entry</th>
                        <th className="px-4 py-3">Exit</th>
                        <th className="px-4 py-3">Net P&L</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {trades.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 text-center">No recorded trades found.</td>
                        </tr>
                      ) : (
                        trades.map((t, i) => {
                          const pnl = t.net_pnl || 0;
                          return (
                            <tr key={i} className="hover:bg-[#162032] transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">{new Date(t.entry_time).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-semibold text-white">{t.ticker}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {t.direction}
                                </span>
                              </td>
                              <td className="px-4 py-3">₹{t.entry_price}</td>
                              <td className="px-4 py-3">{t.exit_price ? `₹${t.exit_price}` : '-'}</td>
                              <td className={`px-4 py-3 font-medium ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {pnl !== 0 ? `₹${pnl}` : '-'}
                              </td>
                              <td className="px-4 py-3">{t.status}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && analytics && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Performance Analytics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">Total Trades</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{analytics.total_trades}</div>
                  </div>
                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
                      <Target className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">Win Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{analytics.win_rate_pct ?? analytics.win_rate_percent ?? 0}%</div>
                  </div>
                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">Profit Factor</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{analytics.profit_factor?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">Max Drawdown</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">₹{analytics.max_drawdown}</div>
                  </div>
                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">Expectancy</span>
                    </div>
                    <div className="text-2xl font-bold text-white">₹{analytics.expectancy ?? analytics.expectancy_per_trade ?? 0}</div>
                  </div>
                  <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-xs uppercase font-semibold">Longest Loss Streak</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{analytics.longest_losing_streak}</div>
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
