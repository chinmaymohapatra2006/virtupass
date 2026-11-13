import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-slate-400 mt-1.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
};
