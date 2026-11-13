import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export interface VerificationBadgeProps {
  status: 'verified' | 'pending' | 'unverified';
  tier?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, tier = 'Tier 1' }) => {
  if (status === 'verified') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Academic Verified • {tier}</span>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span>Verification Pending</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
      <AlertCircle className="w-3.5 h-3.5" />
      <span>Not Verified</span>
    </div>
  );
};
