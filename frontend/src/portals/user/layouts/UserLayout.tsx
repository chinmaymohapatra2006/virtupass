import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  Ticket,
  Receipt,
  User,
  Menu,
  X,
  Layers,
  ShieldCheck,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { PortalSwitcherModal } from '../../../shared/components/PortalSwitcherModal';
import { cn } from '../../../shared/utils/formatters';
import { useAuth } from '../../../shared/hooks/useAuth';

export const UserLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    {
      label: 'Academic Verification',
      path: '/user/verification',
      icon: GraduationCap,
      badge: user?.isVerified ? 'Verified' : 'Pending'
    },
    { label: 'Browse Events', path: '/user/events', icon: Sparkles },
    { label: 'Digital Passes', path: '/user/tickets', icon: Ticket, badge: '2 Active' },
    { label: 'Booking Receipts', path: '/user/bookings', icon: Receipt },
    { label: 'Student Profile', path: '/user/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between h-screen border-r border-slate-800 bg-slate-950/95 sticky top-0 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80">
            <Link to="/" className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">VirtuPass</span>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">Student Portal</h2>
                <p className="text-[11px] text-slate-400">Pass Holder Console</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-brand-500/10 text-brand-400 border-brand-500/20">
                User
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  )}
                >
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
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  ) : (
                    isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Switcher */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => setSwitcherOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Switch Portal</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">Dev</span>
          </button>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.fullName?.charAt(0) || 'S'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Student User'}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.collegeName || 'Verified Institute'} • {user?.cgpa ? `${user.cgpa} CGPA` : 'Unverified'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">VirtuPass • Student</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSwitcherOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            <Layers className="w-4 h-4 text-brand-400" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold',
                  isActive ? 'bg-brand-600/20 text-brand-300' : 'text-slate-400'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        <Outlet />
      </main>

      <PortalSwitcherModal isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </div>
  );
};
