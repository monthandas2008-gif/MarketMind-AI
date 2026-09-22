import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface EvidenceMeterProps {
  strength?: string;
  showIcon?: boolean;
}

export default function EvidenceMeter({ strength = 'moderate', showIcon = true }: EvidenceMeterProps) {
  const str = strength.toLowerCase();
  const isStrong = str === 'strong' || str === 'high';
  const isLimited = str === 'limited' || str === 'low';

  if (isStrong) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
        {showIcon && <ShieldCheck className="w-3 h-3" />}
        <span>Evidence: STRONG</span>
      </div>
    );
  }

  if (isLimited) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-[11px]">
        {showIcon && <ShieldAlert className="w-3 h-3" />}
        <span>Evidence: LIMITED</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#171c28] border border-[#222938] text-[#94a3b8] font-mono text-[11px]">
      {showIcon && <Shield className="w-3 h-3 text-[#64748b]" />}
      <span>Evidence: MODERATE</span>
    </div>
  );
}
