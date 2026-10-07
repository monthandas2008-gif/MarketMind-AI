'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Shield, Calculator, PieChart, Settings } from 'lucide-react';
import { fetchRiskProfile, saveRiskProfile, fetchPortfolioExposure, RiskProfile } from '@/lib/safety';
import PositionSizeCalculator from '@/components/safety/PositionSizeCalculator';

export default function RiskPage() {
  const [profile, setProfile] = useState<RiskProfile | null>(null);
  const [exposure, setExposure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userId = 'demo_user';

  useEffect(() => {
    async function loadRiskData() {
      try {
        setLoading(true);
        const [profData, expData] = await Promise.all([
          fetchRiskProfile(userId).catch(() => null),
          fetchPortfolioExposure(userId).catch(() => null)
        ]);
        setProfile(profData);
        setExposure(expData);
      } catch (err) {
        console.error('Error loading risk data', err);
      } finally {
        setLoading(false);
      }
    }
    loadRiskData();
  }, [userId]);

  return (
    <AppShell title="Risk Management">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Risk Management Dashboard</h1>
        </div>

        {loading ? (
          <div className="text-[#94a3b8] text-sm animate-pulse">Loading risk metrics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Profile Card */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1e293b] pb-3">
                  <Settings className="w-5 h-5 text-[#94a3b8]" />
                  <h2 className="text-lg font-semibold text-white">Risk Profile</h2>
                </div>
                {profile ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8] text-sm">Trading Capital</span>
                      <span className="text-white font-bold">₹{profile.trading_capital}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8] text-sm">Risk Per Trade</span>
                      <span className="text-white font-bold">{profile.risk_per_trade_percent}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8] text-sm">Max Daily Loss</span>
                      <span className="text-white font-bold">{profile.max_daily_loss_percent}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8] text-sm">Max Open Positions</span>
                      <span className="text-white font-bold">{profile.max_open_positions}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[#94a3b8]">Risk profile not configured.</div>
                )}
              </div>

              {/* Portfolio Exposure Card */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1e293b] pb-3">
                  <PieChart className="w-5 h-5 text-[#94a3b8]" />
                  <h2 className="text-lg font-semibold text-white">Portfolio Exposure</h2>
                </div>
                {exposure ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8] text-sm">Open Positions</span>
                      <span className="text-white font-bold">{exposure.open_positions_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#94a3b8] text-sm">Total Risk Exposure</span>
                      <span className="text-white font-bold">₹{exposure.total_risk_exposure || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[#94a3b8]">Exposure data unavailable.</div>
                )}
              </div>
            </div>

            {/* Position Size Calculator */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-[#1e293b] pb-3">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Position Size Calculator</h2>
              </div>
              <PositionSizeCalculator />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
