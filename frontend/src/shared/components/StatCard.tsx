import React from 'react';
import { Card } from './Card';
import { cn } from '../utils/formatters';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  iconBgColor?: string;
  caption?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  icon,
  iconBgColor = 'bg-brand-500/10 text-brand-400',
  caption
}) => {
  return (
    <Card variant="glass" padding="md" className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
          {(change || caption) && (
            <div className="flex items-center gap-2 mt-2">
              {change && (
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  )}
                >
                  {change}
                </span>
              )}
              {caption && <span className="text-xs text-slate-500">{caption}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110 duration-200', iconBgColor)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
