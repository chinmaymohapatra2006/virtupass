import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X, Layers, Activity, User, LogOut } from 'lucide-react';
import { Button } from './Button';
import { PortalSwitcherModal } from './PortalSwitcherModal';
import { useHealth } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: health, isSuccess, isError } = useHealth();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore Events', path: '/events' },
    { label: 'Student Portal', path: '/user/dashboard' },
    { label: 'Organizer Portal', path: '/organizer/dashboard' },
    { label: 'Admin Portal', path: '/admin/dashboard' }
  ];

  const userDashboardPath =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'ORGANIZER'
      ? '/organizer/dashboard'
      : '/user/dashboard';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white leading-tight">
                Virtu<span className="text-brand-400">Pass</span>
              </span>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                College Fest Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-brand-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live Backend Connection Indicator */}
            <div
              title={
                isSuccess
                  ? `Backend connected: fastify API online (${health?.uptimeSeconds}s uptime)`
                  : isError
                  ? 'Backend disconnected or loading'
                  : 'Connecting to backend...'
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSuccess ? 'bg-emerald-400 animate-pulse' : isError ? 'bg-rose-500' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-400 text-[11px] hidden md:inline">
                {isSuccess ? 'API Online' : isError ? 'API Offline' : 'Connecting'}
              </span>
            </div>

            {/* Switch Portal button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSwitcherOpen(true)}
              leftIcon={<Layers className="w-3.5 h-3.5 text-brand-400" />}
            >
              Switch Portal
            </Button>

            {/* Authenticated user vs Guest */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link to={userDashboardPath}>
                  <Button variant="primary" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
                    {user.fullName.split(' ')[0]} ({user.role})
                  </Button>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setSwitcherOpen(true)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Backend Connection</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Activity className="w-3.5 h-3.5" /> {isSuccess ? 'Live Fastify API' : 'Checking API'}
              </span>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium py-1.5 text-slate-300 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link to={userDashboardPath} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Dashboard ({user.fullName})
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Create Student Pass
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <PortalSwitcherModal isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
};
