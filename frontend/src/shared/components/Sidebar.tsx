import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LucideIcon, ShieldCheck, ChevronRight, Layers } from 'lucide-react';
import { cn } from '../utils/formatters';

export interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

export interface SidebarProps {
  portalTitle: string;
  portalSubtitle: string;
  portalBadge?: string;
  portalBadgeColor?: string;
  items: SidebarItem[];
  userProfile?: {
    name: string;
    role: string;
    avatarUrl?: string;
    extra?: string;
  };
  onOpenPortalSwitcher?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  portalTitle,
  portalSubtitle,
  portalBadge = 'Portal',
  portalBadgeColor = 'bg-brand-500/10 text-brand-400 border-brand-500/20',
  items,
  userProfile,
  onOpenPortalSwitcher
}) => {
  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between h-screen border-r border-slate-800 bg-slate-950/95 sticky top-0 overflow-y-auto">
      <div>
        {/* Brand / Portal Header */}
        <div className="p-5 border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight">VirtuPass</span>
            </div>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">{portalTitle}</h2>
              <p className="text-[11px] text-slate-400">{portalSubtitle}</p>
            </div>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', portalBadgeColor)}>
              {portalBadge}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                        {item.badge}
                      </span>
                    ) : (
                      isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Portal Switcher */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {onOpenPortalSwitcher && (
          <button
            onClick={onOpenPortalSwitcher}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Switch Portal</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Demo</span>
          </button>
        )}

        {userProfile && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userProfile.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{userProfile.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
