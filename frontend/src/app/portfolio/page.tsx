'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  Briefcase, TrendingUp, TrendingDown, BarChart3, Target,
  DollarSign, Activity, ChevronDown, ChevronUp, ArrowUpRight,
  ArrowDownRight, Calendar, Shield, AlertTriangle, Info
} from 'lucide-react';

// ─── Demo Data (hardcoded for college project demonstration) ─────────────────

const OPEN_POSITIONS = [
  {
    id: 'pos_1', symbol: 'RELIANCE', company: 'Reliance Industries Ltd',
    sector: 'Energy', qty: 20, avgBuy: 2810.50, cmp: 2942.50,
    unrealisedPnl: 2640.00, unrealisedPct: 4.70, direction: 'LONG',
    entryDate: '2026-09-18', stopLoss: 2720.00, target: 3050.00,
  },
  {
    id: 'pos_2', symbol: 'TCS', company: 'Tata Consultancy Services Ltd',
    sector: 'IT', qty: 5, avgBuy: 3820.00, cmp: 3894.20,
    unrealisedPnl: 371.00, unrealisedPct: 1.94, direction: 'LONG',
    entryDate: '2026-10-01', stopLoss: 3680.00, target: 4100.00,
  },
  {
    id: 'pos_3', symbol: 'HDFCBANK', company: 'HDFC Bank Limited',
    sector: 'Banking', qty: 30, avgBuy: 1510.00, cmp: 1482.10,
    unrealisedPnl: -837.00, unrealisedPct: -1.85, direction: 'LONG',
    entryDate: '2026-09-25', stopLoss: 1440.00, target: 1620.00,
  },
];

const CLOSED_TRADES = [
  {
    id: 'tr_01', symbol: 'INFY', sector: 'IT', direction: 'LONG', qty: 15,
    entryPrice: 1558.00, exitPrice: 1618.40, entryDate: '2026-09-05', exitDate: '2026-09-22',
    netPnl: 898.50, charges: 67.10, outcome: 'WIN', holdingDays: 17,
  },
  {
    id: 'tr_02', symbol: 'ICICIBANK', sector: 'Banking', direction: 'LONG', qty: 25,
    entryPrice: 1120.00, exitPrice: 1088.60, entryDate: '2026-09-10', exitDate: '2026-09-28',
    netPnl: -791.50, charges: 95.20, outcome: 'LOSS', holdingDays: 18,
  },
  {
    id: 'tr_03', symbol: 'ITC', sector: 'FMCG', direction: 'LONG', qty: 80,
    entryPrice: 462.00, exitPrice: 498.70, entryDate: '2026-08-20', exitDate: '2026-09-15',
    netPnl: 2896.00, charges: 148.40, outcome: 'WIN', holdingDays: 26,
  },
  {
    id: 'tr_04', symbol: 'TATAMOTORS', sector: 'Auto', direction: 'LONG', qty: 30,
    entryPrice: 975.50, exitPrice: 940.20, entryDate: '2026-09-01', exitDate: '2026-09-12',
    netPnl: -1059.00, charges: 98.70, outcome: 'LOSS', holdingDays: 11,
  },
  {
    id: 'tr_05', symbol: 'RELIANCE', sector: 'Energy', direction: 'LONG', qty: 15,
    entryPrice: 2745.00, exitPrice: 2865.50, entryDate: '2026-08-08', exitDate: '2026-09-03',
    netPnl: 1782.00, charges: 112.30, outcome: 'WIN', holdingDays: 26,
  },
  {
    id: 'tr_06', symbol: 'TCS', sector: 'IT', direction: 'LONG', qty: 8,
    entryPrice: 3950.00, exitPrice: 3820.00, entryDate: '2026-08-15', exitDate: '2026-08-30',
    netPnl: -1040.00, charges: 86.40, outcome: 'LOSS', holdingDays: 15,
  },
  {
    id: 'tr_07', symbol: 'INFY', sector: 'IT', direction: 'LONG', qty: 20,
    entryPrice: 1590.00, exitPrice: 1650.00, entryDate: '2026-07-20', exitDate: '2026-08-12',
    netPnl: 1168.00, charges: 98.00, outcome: 'WIN', holdingDays: 23,
  },
  {
    id: 'tr_08', symbol: 'ICICIBANK', sector: 'Banking', direction: 'LONG', qty: 40,
    entryPrice: 1065.00, exitPrice: 1095.50, entryDate: '2026-07-10', exitDate: '2026-08-02',
    netPnl: 1196.00, charges: 124.80, outcome: 'WIN', holdingDays: 23,
  },
  {
    id: 'tr_09', symbol: 'ITC', sector: 'FMCG', direction: 'LONG', qty: 100,
    entryPrice: 448.00, exitPrice: 438.00, entryDate: '2026-07-01', exitDate: '2026-07-15',
    netPnl: -1003.00, charges: 106.50, outcome: 'LOSS', holdingDays: 14,
  },
  {
    id: 'tr_10', symbol: 'HDFCBANK', sector: 'Banking', direction: 'LONG', qty: 20,
    entryPrice: 1440.00, exitPrice: 1525.00, entryDate: '2026-06-15', exitDate: '2026-07-08',
    netPnl: 1688.00, charges: 82.40, outcome: 'WIN', holdingDays: 23,
  },
];

// ─── Computed Analytics ───────────────────────────────────────────────────────

const totalCapital = 500000;
const wins = CLOSED_TRADES.filter(t => t.outcome === 'WIN');
const losses = CLOSED_TRADES.filter(t => t.outcome === 'LOSS');
const totalNetPnl = CLOSED_TRADES.reduce((acc, t) => acc + t.netPnl, 0);
const totalOpenUnrealised = OPEN_POSITIONS.reduce((acc, p) => acc + p.unrealisedPnl, 0);
const winRate = (wins.length / CLOSED_TRADES.length) * 100;
const avgWin = wins.reduce((a, t) => a + t.netPnl, 0) / (wins.length || 1);
const avgLoss = losses.reduce((a, t) => a + Math.abs(t.netPnl), 0) / (losses.length || 1);
const profitFactor = avgWin * wins.length / (avgLoss * losses.length || 1);
const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;
const bestTrade = [...CLOSED_TRADES].sort((a, b) => b.netPnl - a.netPnl)[0];
const worstTrade = [...CLOSED_TRADES].sort((a, b) => a.netPnl - b.netPnl)[0];

const sectorExposure: Record<string, number> = {};
OPEN_POSITIONS.forEach(p => {
  const val = p.qty * p.cmp;
  sectorExposure[p.sector] = (sectorExposure[p.sector] || 0) + val;
});
const totalExposed = Object.values(sectorExposure).reduce((a, b) => a + b, 0);

// ─── Helper Components ────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color = 'text-white', icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#64748b]" />
        <span className="text-xs text-[#94a3b8] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold num-tabular ${color}`}>{value}</div>
      {sub && <div className="text-xs text-[#64748b] mt-1">{sub}</div>}
    </div>
  );
}

function PnlBadge({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 font-semibold text-sm num-tabular ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPos ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
      ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [tab, setTab] = useState<'overview' | 'positions' | 'trades' | 'analytics'>('overview');

  return (
    <AppShell title="Portfolio Manager">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Portfolio Manager</h1>
              <p className="text-xs text-[#64748b]">Manthan Das (Admin) • Demo Account • Paper Trading</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748b] bg-amber-950/30 border border-amber-500/20 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Demo portfolio — no real broker connection. Educational only.</span>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Total Capital"
            value={`₹${(totalCapital / 100000).toFixed(1)}L`}
            sub="Paper trading capital"
            icon={DollarSign}
          />
          <MetricCard
            label="Realised P&L"
            value={`₹${totalNetPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            color={totalNetPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
            sub={`${CLOSED_TRADES.length} closed trades`}
            icon={BarChart3}
          />
          <MetricCard
            label="Unrealised P&L"
            value={`₹${totalOpenUnrealised.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            color={totalOpenUnrealised >= 0 ? 'text-emerald-400' : 'text-red-400'}
            sub={`${OPEN_POSITIONS.length} open positions`}
            icon={Activity}
          />
          <MetricCard
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            color={winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
            sub={`${wins.length}W / ${losses.length}L`}
            icon={Target}
          />
        </div>

        {/* Tab Bar */}
        <div className="flex space-x-1 bg-[#111827] border border-[#1e293b] p-1 rounded-lg w-max">
          {(['overview', 'positions', 'trades', 'analytics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-md capitalize transition-colors ${
                tab === t ? 'bg-[#1e293b] text-white' : 'text-[#64748b] hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Sector Exposure */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Sector Exposure (Open Positions)
              </h3>
              <div className="space-y-3">
                {Object.entries(sectorExposure).map(([sector, val]) => {
                  const pct = (val / totalCapital * 100);
                  const barPct = (val / totalExposed * 100);
                  return (
                    <div key={sector}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#94a3b8] font-medium">{sector}</span>
                        <span className="text-white font-semibold num-tabular">
                          ₹{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} <span className="text-[#64748b]">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {/* Cash */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94a3b8] font-medium">Cash (Undeployed)</span>
                    <span className="text-white font-semibold num-tabular">
                      ₹{(totalCapital - totalExposed).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      <span className="text-[#64748b]"> ({((totalCapital - totalExposed) / totalCapital * 100).toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#334155] rounded-full"
                      style={{ width: `${(totalCapital - totalExposed) / totalCapital * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Best & Worst + Quick Stats */}
            <div className="space-y-4">
              <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Performance Highlights</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
                    <div>
                      <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Best Trade</div>
                      <div className="text-sm font-bold text-white mt-0.5">{bestTrade.symbol}</div>
                      <div className="text-xs text-[#64748b]">{bestTrade.entryDate} → {bestTrade.exitDate}</div>
                    </div>
                    <PnlBadge value={bestTrade.netPnl} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-950/30 border border-red-500/20 rounded-lg">
                    <div>
                      <div className="text-[11px] text-red-400 font-semibold uppercase tracking-wider">Worst Trade</div>
                      <div className="text-sm font-bold text-white mt-0.5">{worstTrade.symbol}</div>
                      <div className="text-xs text-[#64748b]">{worstTrade.entryDate} → {worstTrade.exitDate}</div>
                    </div>
                    <PnlBadge value={worstTrade.netPnl} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#64748b] mb-1">Profit Factor</div>
                  <div className="text-xl font-bold text-white num-tabular">{profitFactor.toFixed(2)}x</div>
                  <div className="text-[11px] text-[#94a3b8]">{profitFactor >= 1.5 ? '✅ Good' : profitFactor >= 1 ? '⚠️ Marginal' : '❌ Poor'}</div>
                </div>
                <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#64748b] mb-1">Expectancy / Trade</div>
                  <div className={`text-xl font-bold num-tabular ${expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{expectancy.toFixed(0)}
                  </div>
                  <div className="text-[11px] text-[#94a3b8]">Per closed trade</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: OPEN POSITIONS ── */}
        {tab === 'positions' && (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Open Positions ({OPEN_POSITIONS.length})</h3>
              <span className="text-xs text-[#64748b]">Simulated live prices</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e293b] text-xs text-[#64748b] uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Avg Buy</th>
                    <th className="px-4 py-3 text-right">CMP</th>
                    <th className="px-4 py-3 text-right">Unrealised P&L</th>
                    <th className="px-4 py-3 text-right">Stop Loss</th>
                    <th className="px-4 py-3 text-right">Target</th>
                    <th className="px-4 py-3 text-left">Entry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {OPEN_POSITIONS.map(pos => (
                    <tr key={pos.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{pos.symbol}</div>
                        <div className="text-[11px] text-[#64748b]">{pos.sector}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-white num-tabular">{pos.qty}</td>
                      <td className="px-4 py-3 text-right text-[#94a3b8] num-tabular">₹{pos.avgBuy.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-white font-semibold num-tabular">₹{pos.cmp.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-bold num-tabular ${pos.unrealisedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pos.unrealisedPnl >= 0 ? '+' : ''}₹{pos.unrealisedPnl.toLocaleString('en-IN')}
                        </div>
                        <div className={`text-[11px] ${pos.unrealisedPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pos.unrealisedPct >= 0 ? '+' : ''}{pos.unrealisedPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-red-400 num-tabular text-xs">₹{pos.stopLoss.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 num-tabular text-xs">₹{pos.target.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-left text-xs text-[#94a3b8]">{pos.entryDate}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#1e293b]/50">
                    <td colSpan={4} className="px-4 py-3 text-xs text-[#64748b] font-medium">Total Unrealised P&L</td>
                    <td className={`px-4 py-3 text-right font-bold num-tabular ${totalOpenUnrealised >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totalOpenUnrealised >= 0 ? '+' : ''}₹{totalOpenUnrealised.toLocaleString('en-IN')}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: TRADE HISTORY ── */}
        {tab === 'trades' && (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Closed Trade History ({CLOSED_TRADES.length} trades)</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">{wins.length} Wins</span>
                <span className="px-2 py-1 rounded bg-red-950/50 text-red-400 border border-red-500/20">{losses.length} Losses</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e293b] text-xs text-[#64748b] uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Entry ₹</th>
                    <th className="px-4 py-3 text-right">Exit ₹</th>
                    <th className="px-4 py-3 text-right">Net P&L</th>
                    <th className="px-4 py-3 text-right">Days</th>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {CLOSED_TRADES.map(trade => (
                    <tr key={trade.id} className="border-b border-[#1e293b] hover:bg-[#1e293b]/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{trade.symbol}</div>
                        <div className="text-[11px] text-[#64748b]">{trade.sector}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-white num-tabular">{trade.qty}</td>
                      <td className="px-4 py-3 text-right text-[#94a3b8] num-tabular">₹{trade.entryPrice.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-white num-tabular">₹{trade.exitPrice.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold num-tabular ${trade.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.netPnl >= 0 ? '+' : ''}₹{Math.abs(trade.netPnl).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#94a3b8] text-xs">{trade.holdingDays}d</td>
                      <td className="px-4 py-3 text-left text-[11px] text-[#64748b]">{trade.entryDate} → {trade.exitDate}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          trade.outcome === 'WIN'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-950/60 text-red-400 border border-red-500/30'
                        }`}>
                          {trade.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#1e293b]/50">
                    <td colSpan={4} className="px-4 py-3 text-xs text-[#64748b] font-medium">Total Realised Net P&L</td>
                    <td className={`px-4 py-3 text-right font-bold num-tabular ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totalNetPnl >= 0 ? '+' : ''}₹{totalNetPnl.toLocaleString('en-IN')}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: ANALYTICS ── */}
        {tab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard label="Win Rate" value={`${winRate.toFixed(1)}%`}
              color={winRate >= 60 ? 'text-emerald-400' : winRate >= 45 ? 'text-amber-400' : 'text-red-400'}
              sub={`${wins.length} wins out of ${CLOSED_TRADES.length} trades`} icon={Target} />
            <MetricCard label="Profit Factor" value={`${profitFactor.toFixed(2)}x`}
              color={profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}
              sub="Avg Win ÷ Avg Loss ratio" icon={TrendingUp} />
            <MetricCard label="Expectancy" value={`₹${expectancy.toFixed(0)}`}
              color={expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}
              sub="Expected P&L per trade" icon={BarChart3} />
            <MetricCard label="Avg Win" value={`₹${avgWin.toFixed(0)}`}
              color="text-emerald-400" sub={`Over ${wins.length} winning trades`} icon={TrendingUp} />
            <MetricCard label="Avg Loss" value={`₹${avgLoss.toFixed(0)}`}
              color="text-red-400" sub={`Over ${losses.length} losing trades`} icon={TrendingDown} />
            <MetricCard label="Realised Returns" value={`${(totalNetPnl / totalCapital * 100).toFixed(2)}%`}
              color={totalNetPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
              sub={`On ₹${(totalCapital / 100000).toFixed(1)}L capital`} icon={DollarSign} />
            <MetricCard label="Total Charges" value={`₹${CLOSED_TRADES.reduce((a, t) => a + t.charges, 0).toFixed(0)}`}
              color="text-amber-400" sub="STT + Exchange + SEBI + GST" icon={Shield} />
            <MetricCard label="Avg Holding Period" value={`${Math.round(CLOSED_TRADES.reduce((a, t) => a + t.holdingDays, 0) / CLOSED_TRADES.length)} days`}
              sub="Per closed trade" icon={Calendar} />
            <div className="bg-[#111827] border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Educational Note</span>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                This portfolio data is for educational demonstration only. No real money is involved. Connect a SEBI-registered broker API for live portfolio tracking. Always consult a financial advisor before investing.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
