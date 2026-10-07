'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculatePositionSize, PositionCalculationResponse } from '@/lib/safety';

interface PositionSizeCalculatorProps {
  defaultCapital?: number;
  defaultRiskPercent?: number;
  onCalculated?: (result: PositionCalculationResponse) => void;
}

export function PositionSizeCalculator({
  defaultCapital = 100000,
  defaultRiskPercent = 1,
  onCalculated,
}: PositionSizeCalculatorProps) {
  const [capital, setCapital] = useState(defaultCapital);
  const [riskPercent, setRiskPercent] = useState(defaultRiskPercent);
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [target, setTarget] = useState<number | ''>('');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PositionCalculationResponse | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryPrice === '' || stopLoss === '') {
      setError('Entry price and Stop loss are required.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await calculatePositionSize({
        capital,
        risk_percent: riskPercent,
        entry_price: Number(entryPrice),
        stop_loss: Number(stopLoss),
        target: target === '' ? undefined : Number(target),
        direction,
      });
      
      setResult(res);
      if (onCalculated) {
        onCalculated(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate position size.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-[#334155]">
        <Calculator className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Position Size Calculator</h2>
      </div>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Capital (INR)</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-[#0b0f19] border border-[#334155] text-white placeholder:text-[#64748b] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Risk (%)</label>
            <input
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-[#0b0f19] border border-[#334155] text-white placeholder:text-[#64748b] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'BUY' | 'SELL')}
              className="w-full bg-[#0b0f19] border border-[#334155] text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            >
              <option value="BUY">Long (BUY)</option>
              <option value="SELL">Short (SELL)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Entry Price</label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-[#0b0f19] border border-[#334155] text-white placeholder:text-[#64748b] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Stop Loss</label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-[#0b0f19] border border-[#334155] text-white placeholder:text-[#64748b] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-[#94a3b8]">Target (Optional)</label>
            <input
              type="number"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="w-full bg-[#0b0f19] border border-[#334155] text-white placeholder:text-[#64748b] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Calculator className="w-4 h-4 mr-2" />
          )}
          Calculate Position
        </Button>
      </form>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-md text-rose-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4 pt-4 border-t border-[#334155]">
          <div className="p-4 bg-[#1e293b] rounded-lg border border-[#334155] flex flex-col items-center justify-center text-center">
            <div className="text-[#94a3b8] text-sm mb-1">Maximum Safe Quantity</div>
            <div className="text-3xl font-mono text-emerald-400 font-bold">
              {result.recommended_quantity}
            </div>
            <div className="text-xs text-[#64748b] mt-2 italic">
              {result.formula_notes}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-[#0b0f19] rounded border border-[#334155]">
              <div className="text-[#94a3b8] mb-1">Risk Per Share</div>
              <div className="font-mono text-white">₹{result.risk_per_share.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-[#0b0f19] rounded border border-[#334155]">
              <div className="text-[#94a3b8] mb-1">Position Value</div>
              <div className="font-mono text-white">₹{result.position_value.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-[#0b0f19] rounded border border-[#334155]">
              <div className="text-[#94a3b8] mb-1">Est. Charges</div>
              <div className="font-mono text-rose-400">₹{result.estimated_charges.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-[#0b0f19] rounded border border-[#334155]">
              <div className="text-[#94a3b8] mb-1">Est. Slippage</div>
              <div className="font-mono text-rose-400">₹{result.estimated_slippage.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-[#0b0f19] rounded border border-[#334155]">
              <div className="text-[#94a3b8] mb-1">Worst-Case Loss</div>
              <div className="font-mono text-rose-500">₹{result.worst_case_loss.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-[#0b0f19] rounded border border-[#334155]">
              <div className="text-[#94a3b8] mb-1">Risk:Reward</div>
              <div className="font-mono text-white">
                {result.reward_risk_ratio > 0 ? `1:${result.reward_risk_ratio.toFixed(2)}` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#0b0f19] rounded border border-[#334155] flex justify-between items-center">
            <div className="text-[#94a3b8] text-sm">Capital Commitment</div>
            <div className={`font-mono font-semibold ${
              result.capital_commitment_percent < 20 ? 'text-emerald-400' :
              result.capital_commitment_percent < 40 ? 'text-amber-400' : 'text-rose-500'
            }`}>
              {result.capital_commitment_percent.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionSizeCalculator;
