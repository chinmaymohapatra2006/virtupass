import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, ArrowRight, Lock, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Badge } from '../shared/components/Badge';
import { useAuth } from '../shared/hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('student@virtupass.demo');
  const [password, setPassword] = useState('Demo@123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);

      // Role-based target dashboard
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'ORGANIZER') {
        navigate('/organizer/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Sign In to VirtuPass</h2>
          <p className="text-xs text-slate-400">Authenticated via Fastify REST API & JWT Tokens</p>
        </div>

        {/* Demo Credentials Quick Fill Banner */}
        <Card variant="glass" padding="sm" className="border-brand-500/30 bg-brand-950/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              1-Click Demo Accounts (Password: Demo@123)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => fillDemo('student@virtupass.demo', 'Student')}
              className={`p-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                email === 'student@virtupass.demo'
                  ? 'bg-brand-600 text-white border-brand-400 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => fillDemo('organizer@virtupass.demo', 'Organizer')}
              className={`p-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                email === 'organizer@virtupass.demo'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🎪 Organizer
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@virtupass.demo', 'Admin')}
              className={`p-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                email === 'admin@virtupass.demo'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              🛡️ Admin
            </button>
          </div>
        </Card>

        {/* Login Form */}
        <Card variant="glass" padding="lg">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@virtupass.demo"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 pl-10 pr-10 py-2.5 text-sm transition-all focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-4"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Need an account?{' '}
            <Link to="/register" className="text-brand-400 hover:underline font-semibold">
              Create Student or Organizer Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
