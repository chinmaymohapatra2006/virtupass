import React from 'react';
import { Award, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Link } from 'react-router-dom';

export interface CgpaDiscountCardProps {
  cgpa: number;
  discountPercentage: number;
  tierName?: string;
}

export const CgpaDiscountCard: React.FC<CgpaDiscountCardProps> = ({
  cgpa = 9.3,
  discountPercentage = 30,
  tierName = 'Merit Scholar Gold'
}) => {
  return (
    <Card variant="glass" padding="md" className="relative overflow-hidden border-brand-500/30 bg-gradient-to-br from-brand-950/40 via-slate-900/80 to-slate-950">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-600/30 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">{tierName}</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> Active Perk
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5">
              {discountPercentage}% Academic Merit Discount
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Based on your verified CGPA of <strong className="text-brand-300 font-semibold">{cgpa}</strong> from National Institute of Technology, Trichy. Applied automatically at event checkout!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/user/events">
            <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Explore Discounted Fests
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
