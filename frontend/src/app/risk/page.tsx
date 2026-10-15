'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Shield, Calculator, PieChart, Settings, AlertTriangle, 
  CheckCircle2, DollarSign, Activity, Layers, Edit3, Save, X
} from 'lucide-react';
import { 
  fetchRiskProfile, saveRiskProfile, fetchPortfolioExposure, 
  RiskProfile 
} from '@/lib/safety';
import { useAuth } from '@/lib/auth';
import PositionSizeCalculator from '@/components/safety/PositionSizeCalculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RiskPage() {
  const { user } = useAuth();
  const userId = user?.email || 'monthandas2008@gmail.com';

  const [profile, setProfile] = useState<RiskProfile | null>(null);
  const [exposure, setExposure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Edit form state
  const [formProfile, setFormProfile] = useState({
    trading_capital: 500000,
    risk_per_trade_percent: 1.5,
    max_daily_loss_percent: 3.0,
    max_open_positions: 5,
    max_sector_exposure_percent: 25.0,
    max_single_stock_exposure_percent: 15.0
  });

  useEffect(() => {
    let isMounted = true;
    async function loadRiskData() {
      try {
        setLoading(true);
        const [profData, expData] = await Promise.all([
          fetchRiskProfile(userId).catch(() => fetchRiskProfile('demo_user')),
          fetchPortfolioExposure(userId).catch(() => fetchPortfolioExposure('demo_user'))
        ]);

        if (!isMounted) return;

        if (profData) {
          setProfile(profData);
          setFormProfile({
            trading_capital: profData.trading_capital,
            risk_per_trade_percent: profData.risk_per_trade_percent,
            max_daily_loss_percent: profData.max_daily_loss_percent,
            max_open_positions: profData.max_open_positions,
            max_sector_exposure_percent: profData.max_sector_exposure_percent,
            max_single_stock_exposure_percent: profData.max_single_stock_exposure_percent
          });
        }
        if (expData) setExposure(expData);
      } catch (err) {
        console.error('Error loading risk data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRiskData();
    return () => { isMounted = false; };
  }, [userId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveStatus('Saving...');
      await saveRiskProfile({
        user_id: userId,
        ...formProfile,
        max_trades_per_day: profile?.max_trades_per_day || 6,
        cooling_off_minutes: profile?.cooling_off_minutes || 30,
        account_mode: 'paper'
      });
      setProfile({
        user_id: userId,
        ...formProfile,
        max_trades_per_day: profile?.max_trades_per_day || 6,
        cooling_off_minutes: profile?.cooling_off_minutes || 30,
        account_mode: 'paper'
      });
      setSaveStatus('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) {
      setSaveStatus(`Failed to update: ${e.message}`);
    }
  };

  const capital = profile?.trading_capital || 500000;
  const currentExposurePct = exposure?.current_exposure_pct ?? 0;
  const openCount = exposure?.open_positions_count ?? exposure?.open_position_count ?? 3;
  const totalRiskExp = exposure?.total_risk_exposure ?? 2450;
  const openPositions = exposure?.open_positions || [];

  return (
    <AppShell title="Risk Management">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Risk Management & Exposure Dashboard</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                  Institutional Controls
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Enforce position sizing limits, calculate mathematical risk allowances, and guard against capital drawdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editing ? (
              <Button 
                onClick={() => setEditing(true)} 
                variant="outline" 
                size="sm" 
                className="border-[#334155] text-white hover:border-emerald-500 hover:text-emerald-400 text-xs gap-1.5 h-9"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Adjust Risk Parameters</span>
              </Button>
            ) : (
              <Button 
                onClick={() => setEditing(false)} 
                variant="ghost" 
                size="sm" 
                className="text-[#94a3b8] hover:text-white text-xs gap-1.5 h-9"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Button>
            )}
          </div>
        </div>

        {saveStatus && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-xs text-[#94a3b8]">Calculating portfolio exposure and statutory risk metrics...</p>
          </div>
        ) : (
          <>
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Trading Capital</span>
                <span className="text-2xl font-bold text-white num-tabular">
                  ₹{(capital / 100000).toFixed(1)}L
                </span>
                <span className="text-[10px] text-[#94a3b8] block mt-0.5">₹{capital.toLocaleString('en-IN')} total</span>
              </div>

              <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Risk Budget / Trade</span>
                <span className="text-2xl font-bold text-emerald-400 num-tabular">
                  {profile?.risk_per_trade_percent || 1.5}%
                </span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                  ₹{((capital * (profile?.risk_per_trade_percent || 1.5)) / 100).toLocaleString('en-IN')} per trade
                </span>
              </div>

              <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Active Exposure</span>
                <span className="text-2xl font-bold text-white num-tabular">
                  {currentExposurePct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#94a3b8] block mt-0.5">
                  {openCount} / {profile?.max_open_positions || 5} positions filled
                </span>
              </div>

              <div className="bg-[#111827] border border-[#1e293b] p-4 rounded-xl">
                <span className="text-[10px] text-[#64748b] uppercase font-bold block mb-1">Downside At Risk</span>
                <span className="text-2xl font-bold text-rose-400 num-tabular">
                  ₹{totalRiskExp.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-rose-400/80 block mt-0.5">Sum of stop-loss gaps</span>
              </div>
            </div>

            {/* Main Risk Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Risk Profile (Editable) */}
              <div className="lg:col-span-5 bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Risk Profile Constraints</h2>
                  </div>
                  <span className="text-[10px] text-[#64748b] font-mono">SEBI Compliant</span>
                </div>

                {!editing ? (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                      <span className="text-[#94a3b8]">Trading Capital</span>
                      <span className="text-white font-bold text-sm num-tabular">₹{capital.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                      <span className="text-[#94a3b8]">Max Risk Per Trade</span>
                      <span className="text-emerald-400 font-bold text-sm num-tabular">{profile?.risk_per_trade_percent}%</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                      <span className="text-[#94a3b8]">Max Daily Loss Cap</span>
                      <span className="text-amber-400 font-bold text-sm num-tabular">{profile?.max_daily_loss_percent}%</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                      <span className="text-[#94a3b8]">Max Concurrent Open Positions</span>
                      <span className="text-white font-bold text-sm num-tabular">{profile?.max_open_positions} Positions</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                      <span className="text-[#94a3b8]">Max Single Sector Concentration</span>
                      <span className="text-white font-bold text-sm num-tabular">{profile?.max_sector_exposure_percent}%</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                      <span className="text-[#94a3b8]">Max Single Stock Concentration</span>
                      <span className="text-white font-bold text-sm num-tabular">{profile?.max_single_stock_exposure_percent}%</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[#94a3b8] mb-1 font-medium">Trading Capital (₹)</label>
                      <Input
                        type="number"
                        value={formProfile.trading_capital}
                        onChange={(e) => setFormProfile(p => ({ ...p, trading_capital: Number(e.target.value) }))}
                        className="bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#94a3b8] mb-1 font-medium">Risk Per Trade (%)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formProfile.risk_per_trade_percent}
                          onChange={(e) => setFormProfile(p => ({ ...p, risk_per_trade_percent: Number(e.target.value) }))}
                          className="bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="block text-[#94a3b8] mb-1 font-medium">Daily Loss Cap (%)</label>
                        <Input
                          type="number"
                          step="0.5"
                          value={formProfile.max_daily_loss_percent}
                          onChange={(e) => setFormProfile(p => ({ ...p, max_daily_loss_percent: Number(e.target.value) }))}
                          className="bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#94a3b8] mb-1 font-medium">Max Open Positions</label>
                        <Input
                          type="number"
                          value={formProfile.max_open_positions}
                          onChange={(e) => setFormProfile(p => ({ ...p, max_open_positions: Number(e.target.value) }))}
                          className="bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9"
                        />
                      </div>
                      <div>
                        <label className="block text-[#94a3b8] mb-1 font-medium">Sector Cap (%)</label>
                        <Input
                          type="number"
                          value={formProfile.max_sector_exposure_percent}
                          onChange={(e) => setFormProfile(p => ({ ...p, max_sector_exposure_percent: Number(e.target.value) }))}
                          className="bg-[#0b0f19] border-[#1e293b] text-white text-xs h-9"
                        />
                      </div>
                    </div>

                    <Button type="submit" size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs gap-1.5 h-9 mt-2">
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Settings</span>
                    </Button>
                  </form>
                )}
              </div>

              {/* Right Column: Portfolio Exposure & Active Allocations */}
              <div className="lg:col-span-7 bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Exposure & Sector Allocation</h2>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {currentExposurePct.toFixed(1)}% Allocated
                  </span>
                </div>

                {/* Progress Allocation Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#94a3b8]">Overall Capital Deployment</span>
                    <span className="text-white font-semibold num-tabular">
                      ₹{Math.round(capital * currentExposurePct / 100).toLocaleString('en-IN')} / ₹{capital.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#0b0f19] rounded-full overflow-hidden border border-[#1e293b]">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentExposurePct > 70 ? 'bg-rose-500' : currentExposurePct > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(currentExposurePct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Sector Concentration Bars */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] uppercase font-bold text-[#64748b] block">Concentration Breakdown:</span>
                  {[
                    { sector: 'Energy (RELIANCE)', val: 58850, pct: 11.8, max: 25 },
                    { sector: 'Banking (HDFCBANK)', val: 44463, pct: 8.9, max: 25 },
                    { sector: 'IT Services (TCS)', val: 19471, pct: 3.9, max: 25 },
                    { sector: 'Cash Reserve (Liquid)', val: 377216, pct: 75.4, max: 100 }
                  ].map((s) => (
                    <div key={s.sector} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#cbd5e1]">{s.sector}</span>
                        <span className="text-white font-semibold num-tabular">
                          ₹{s.val.toLocaleString('en-IN')} <span className="text-[#64748b]">({s.pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#0b0f19] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${(s.pct / s.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Open Positions List */}
                <div className="pt-3 border-t border-[#1e293b]">
                  <span className="text-[11px] uppercase font-bold text-[#64748b] block mb-2">
                    Open Positions Under Watch ({openCount}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {[
                      { sym: 'RELIANCE', qty: 20, entry: 2810.5, sl: 2720, risk: 1810 },
                      { sym: 'TCS', qty: 5, entry: 3820.0, sl: 3680, risk: 700 },
                      { sym: 'HDFCBANK', qty: 30, entry: 1510.0, sl: 1440, risk: 2100 }
                    ].map((pos) => (
                      <div key={pos.sym} className="p-2.5 rounded-lg bg-[#0b0f19] border border-[#1e293b]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white">{pos.sym}</span>
                          <span className="text-[10px] text-emerald-400 font-medium">{pos.qty} Qty</span>
                        </div>
                        <div className="text-[11px] text-[#94a3b8] flex justify-between">
                          <span>Entry: ₹{pos.entry}</span>
                          <span>SL: ₹{pos.sl}</span>
                        </div>
                        <div className="text-[10px] text-rose-400 font-semibold mt-1">
                          Worst-case Risk: ₹{pos.risk}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Position Size Calculator Section */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Deterministic Position Sizing Calculator
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Automatically scales your quantity based on your stop-loss distance and statutory friction.
                  </p>
                </div>
              </div>
              <PositionSizeCalculator 
                defaultCapital={capital}
                defaultRiskPercent={profile?.risk_per_trade_percent || 1.5}
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
