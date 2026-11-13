import React, { HTMLAttributes } from 'react';
import { cn } from '../utils/formatters';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantStyles = {
    default: 'bg-slate-900/90 border border-slate-800 shadow-xl rounded-2xl',
    glass: 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl',
    interactive: 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:shadow-2xl transition-all duration-200 rounded-2xl',
    bordered: 'bg-transparent border-2 border-slate-800 rounded-2xl'
  };

  return (
    <div className={cn(variantStyles[variant], paddingStyles[padding], className)} {...props}>
      {children}
    </div>
  );
};
