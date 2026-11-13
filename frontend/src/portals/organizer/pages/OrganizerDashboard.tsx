import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  PlusCircle,
  Ticket,
  DollarSign,
  ScanLine,
  ArrowRight,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatCard } from '../../../shared/components/StatCard';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useOrganizerEvents, useOrganizerAnalytics, useOrganizerBookings } from '../../../shared/hooks/useApi';

export const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const isApproved = user?.approvalStatus === 'APPROVED';

  const { data: analytics, isLoading: analyticsLoading } = useOrganizerAnalytics();
  const { data: events = [], isLoading: eventsLoading } = useOrganizerEvents();
  const { data: bookings = [] } = useOrganizerBookings();

  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${user?.organizationName || user?.fullName || 'Event Organizer'}!`}
        description={`${user?.collegeName || 'Host University'} • Lead: ${user?.fullName || 'Coordinator'}`}
        badge={
          isApproved ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Authorized Host
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Approval Pending
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-3">
            <Link to="/organizer/scanner">
              <Button size="sm" variant="accent" leftIcon={<ScanLine className="w-4 h-4" />}>
                Launch Gate Scanner
              </Button>
            </Link>
            <Link to="/organizer/events/new">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create New Event
              </Button>
            </Link>
          </div>
        }
      />

      {/* Pending Approval Banner if new organizer */}
      {!isApproved && (
        <Card variant="default" padding="md" className="border-amber-500/30 bg-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Organizer Application Awaiting Approval</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Your college club application is currently under review by platform administrators. You can configure draft events and preview gate scanner telemetry, but live ticket sales will activate upon admin approval.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Managed Events"
          value={analytics?.totalEvents ?? events.length}
          caption="Fest & Symposium Catalog"
          icon={<CalendarDays className="w-5 h-5" />}
          iconBgColor="bg-teal-500/10 text-teal-400"
        />
        <StatCard
          label="Published Live Fests"
          value={analytics?.publishedEvents ?? events.filter((e) => e.status === 'PUBLISHED').length}
          change="Public Catalog Active"
          isPositive={true}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Tickets Issued"
          value={analytics?.totalTicketsSold ?? confirmedBookings.reduce((sum, b) => sum + b.quantity, 0)}
          change="Confirmed Registrations"
          isPositive={true}
          icon={<Ticket className="w-5 h-5" />}
          iconBgColor="bg-brand-500/10 text-brand-400"
        />
        <StatCard
          label="Gross Verified Revenue"
          value={`₹${(analytics?.totalRevenueINR ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          caption="Direct Gateway Settlements"
          icon={<DollarSign className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Turnstile Admitted Attendees"
          value={analytics?.totalAttendeesAdmitted ?? 0}
          caption="Verified Gate Check-ins"
          icon={<ScanLine className="w-5 h-5" />}
          iconBgColor="bg-cyan-500/10 text-cyan-400"
        />
        <StatCard
          label="Gate Check-In Rate"
          value={`${analytics?.attendanceRate ?? 0}%`}
          change="Real-time Turnstile Telemetry"
          isPositive={true}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-purple-500/10 text-purple-400"
        />
      </div>

      {/* Events & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Your Managed Events</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tracking ticket tiers and academic discount metrics</p>
              </div>
              <Link to="/organizer/events" className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {eventsLoading ? (
                <p className="text-center py-6 text-slate-500 text-xs">Loading organizer events...</p>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">No events registered yet.</p>
                  <Link to="/organizer/events/new" className="mt-2 inline-block">
                    <Button size="sm" variant="primary">Create Your First Event</Button>
                  </Link>
                </div>
              ) : (
                events.slice(0, 3).map((ev) => {
                  const soldCapacity = ev.totalCapacity - ev.remainingCapacity;
                  const fillPct = Math.min(100, Math.round((soldCapacity / ev.totalCapacity) * 100));
                  return (
                    <div key={ev.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">{ev.category}</span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{ev.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{ev.venue}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <Badge variant={ev.status === 'PUBLISHED' ? 'success' : 'warning'}>
                            {ev.status}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">{soldCapacity} / {ev.totalCapacity} passes sold</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                          <span>Capacity: {ev.totalCapacity}</span>
                          <span className="text-emerald-400 font-semibold">{fillPct}% Reserved</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{ev.ticketCategories.length} Ticket Categories</span>
                        <div className="flex gap-2">
                          <Link to="/organizer/scanner">
                            <Button size="sm" variant="outline">Gate Scanner</Button>
                          </Link>
                          <Link to="/organizer/bookings">
                            <Button size="sm" variant="secondary">Attendee Roster</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Live Registrations Sidebar */}
        <div className="space-y-6">
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                Recent Registrations
              </h3>
              <Link to="/organizer/bookings" className="text-[11px] text-teal-400 hover:text-teal-300">
                View All
              </Link>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {bookings.length === 0 ? (
                <p className="text-center py-6 text-slate-500 text-xs">No registrations yet.</p>
              ) : (
                bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white">{b.userName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{b.eventTitle}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-teal-300 font-medium">
                        {b.ticketCategoryName} (x{b.quantity})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        ₹{b.finalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
