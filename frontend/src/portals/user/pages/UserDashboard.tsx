import React from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  GraduationCap,
  Calendar,
  ArrowRight,
  QrCode,
  Sparkles,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatCard } from '../../../shared/components/StatCard';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { VerificationBadge } from '../components/VerificationBadge';
import { CgpaDiscountCard } from '../components/CgpaDiscountCard';
import { useEvents, useMyBookings, useMyTickets } from '../../../shared/hooks/useApi';
import { useAuth } from '../../../shared/hooks/useAuth';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: events } = useEvents();
  const { data: bookings } = useMyBookings();
  const { data: tickets } = useMyTickets();

  const isVerified = user?.isVerified ?? false;
  const studentCgpa = user?.cgpa;

  // Centralized CGPA discount formula
  let meritDiscountPercent = 0;
  if (isVerified && studentCgpa) {
    if (studentCgpa > 9.5) meritDiscountPercent = 20;
    else if (studentCgpa > 9.0) meritDiscountPercent = 15;
    else if (studentCgpa > 8.5) meritDiscountPercent = 10;
  }

  return (
    <div className="space-y-8">
      {/* Header with Welcome and Verification status */}
      <PageHeader
        title={`Welcome back, ${user?.fullName || 'Student'}!`}
        description={`${user?.collegeName || 'Vellore Institute of Technology'} • ${user?.department || 'Computer Science & Engineering'} (${user?.studentId || 'VIT20260001'})`}
        badge={
          <VerificationBadge
            status={isVerified ? 'verified' : 'unverified'}
            tier={user?.academicTier || 'Tier 1 Institutional'}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/user/tickets">
              <Button size="sm" variant="primary" leftIcon={<QrCode className="w-4 h-4" />}>
                Pass Vault ({tickets?.length || 0})
              </Button>
            </Link>
            <Link to="/user/bookings">
              <Button size="sm" variant="secondary" leftIcon={<Receipt className="w-4 h-4" />}>
                Orders ({bookings?.length || 0})
              </Button>
            </Link>
          </div>
        }
      />

      {/* CGPA Discount Eligibility Card */}
      {isVerified && studentCgpa ? (
        <CgpaDiscountCard
          cgpa={studentCgpa}
          discountPercentage={meritDiscountPercent}
          tierName={user?.academicTier || 'Gold Academic Tier'}
        />
      ) : (
        <Card variant="default" padding="md" className="border-amber-500/30 bg-amber-950/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Academic Identity Not Yet Verified</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete institutional verification to activate up to 20% merit discount on campus fests.
                </p>
              </div>
            </div>
            <Link to="/user/verification">
              <Button size="sm" variant="accent" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Verify Now
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Key Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Digital Gate Passes"
          value={tickets ? tickets.length.toString() : '0'}
          caption="Ready for QR Entry"
          isPositive={true}
          icon={<QrCode className="w-5 h-5" />}
          iconBgColor="bg-brand-500/10 text-brand-400"
        />
        <StatCard
          label="Academic CGPA"
          value={isVerified && studentCgpa ? studentCgpa.toFixed(2) : 'Pending'}
          caption={isVerified ? 'Verified Institutional Record' : 'Requires Verification'}
          icon={<GraduationCap className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Campus Fests"
          value={events ? events.length.toString() : '6'}
          caption="Active Across Colleges"
          icon={<Calendar className="w-5 h-5" />}
          iconBgColor="bg-cyan-500/10 text-cyan-400"
        />
        <StatCard
          label="Discount Eligibility"
          value={isVerified ? `${meritDiscountPercent}%` : '0%'}
          change={isVerified ? 'Active Savings' : 'Not Active'}
          isPositive={isVerified && meritDiscountPercent > 0}
          icon={<Sparkles className="w-5 h-5" />}
          iconBgColor="bg-amber-500/10 text-amber-400"
        />
      </div>

      {/* Reservations & Campus Fests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Your Reserved Festival Bookings</h3>
                <p className="text-xs text-slate-400 mt-0.5">Under 15-minute temporary inventory reservation</p>
              </div>
              <Link to="/user/bookings" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
                All Bookings <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(bookings || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active reservations found.{' '}
                <Link to="/events" className="text-brand-400 font-semibold underline">
                  Explore events to reserve passes
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {(bookings || []).slice(0, 3).map((b) => (
                  <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300">{b.id}</span>
                        <Badge variant="warning">{b.status}</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-white">{b.eventTitle}</h4>
                      <p className="text-xs text-slate-400">{b.ticketCategoryName} • {b.quantity} pass(es)</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-emerald-400 block">{formatCurrency(b.finalAmount)}</span>
                      <span className="text-[10px] text-slate-500">{b.discountPercentage}% merit discount</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Featured College Events Right Card */}
        <div className="space-y-6">
          <Card variant="glass" padding="md" className="border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Featured Campus Fests</h3>
              <Link to="/events" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
                Explore All
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {(events || []).slice(0, 3).map((e) => (
                <Link key={e.id} to={`/events/${e.id}`} className="block p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase text-brand-400">{e.category}</span>
                    <span className="text-xs font-black text-white">{formatCurrency(e.ticketCategories[0]?.basePrice || 0)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{e.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{e.collegeName}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};