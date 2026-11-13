import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  CalendarCheck2,
  Ticket,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Server,
  XCircle,
  ScanLine
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatCard } from '../../../shared/components/StatCard';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { useAdminAnalytics, useAdminEvents, useAdminAuditLogs } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';

export const AdminDashboard: React.FC = () => {
  const { data: analytics, refetch: refetchAnalytics } = useAdminAnalytics();
  const { data: events = [], refetch: refetchEvents } = useAdminEvents();
  const { data: auditLogs = [], refetch: refetchLogs } = useAdminAuditLogs({ limit: 6 });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingEvents = events.filter((e) => e.status === 'PENDING_APPROVAL');

  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await apiClient.approveAdminEvent(eventId);
      refetchEvents();
      refetchAnalytics();
      refetchLogs();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId: string) => {
    const reason = prompt('Please provide reason for event rejection:');
    if (!reason || reason.trim().length < 5) {
      alert('Rejection reason must be at least 5 characters');
      return;
    }

    setActionLoading(eventId);
    try {
      await apiClient.rejectAdminEvent(eventId, reason.trim());
      refetchEvents();
      refetchAnalytics();
      refetchLogs();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Administration Console"
        description="VirtuPass master oversight: Academic verification pipelines, collegiate organizers, event approvals, and gate audits."
        badge={
          <Badge variant="warning" className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Access
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/events">
              <Button size="sm" variant="primary" leftIcon={<CalendarCheck2 className="w-4 h-4" />}>
                Review Events ({pendingEvents.length})
              </Button>
            </Link>
          </div>
        }
      />

      {/* Architecture Alert */}
      <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-amber-200">
          <Server className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>In-Memory Operational Mode:</strong> All metrics, event registries, and user lists are held in structured server memory. Zero database dependencies.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
          State Resets on Server Restart
        </span>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Registered Students"
          value={analytics?.totalStudents ?? 0}
          caption="Verified University Attendees"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label="Organizers & Clubs"
          value={analytics?.totalOrganizers ?? 0}
          change={`${analytics?.pendingOrganizerApprovals ?? 0} Pending Verification`}
          isPositive={analytics?.pendingOrganizerApprovals === 0}
          icon={<Building className="w-5 h-5" />}
          iconBgColor="bg-indigo-500/10 text-indigo-400"
        />
        <StatCard
          label="Published College Fests"
          value={analytics?.publishedEvents ?? 0}
          change={`Out of ${analytics?.totalEvents ?? 0} Total Events`}
          isPositive={true}
          icon={<CalendarCheck2 className="w-5 h-5" />}
          iconBgColor="bg-purple-500/10 text-purple-400"
        />
        <StatCard
          label="Issued Gate Passes"
          value={analytics?.totalTicketsIssued ?? 0}
          change={`${analytics?.attendanceRate ?? 0}% Checked-in`}
          isPositive={true}
          icon={<Ticket className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          label="Event Review Queue"
          value={analytics?.pendingEventApprovals ?? pendingEvents.length}
          change={pendingEvents.length > 0 ? 'Action Required' : 'Queue Clear'}
          isPositive={pendingEvents.length === 0}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-500/10 text-amber-400"
        />
        <StatCard
          label="Verified Gross Volume"
          value={`₹${(analytics?.totalRevenueINR ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          caption="Confirmed Student Purchases"
          icon={<DollarSign className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      {/* Content Split: Pending Event Approvals & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Events Awaiting Moderation */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Events Awaiting Platform Authorization
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Collegiate fests submitted by verified club leads</p>
              </div>
              <Link to="/admin/events" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                View Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {pendingEvents.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">All Event Submissions Reviewed</p>
                  <p className="text-xs text-slate-500 mt-0.5">No pending fests waiting for admin moderation.</p>
                </div>
              ) : (
                pendingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{ev.title}</h4>
                        <Badge variant="warning">{ev.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ev.organizerName} • {ev.collegeName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        Venue: {ev.venue} • Capacity: {ev.totalCapacity} passes
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-500"
                        isLoading={actionLoading === ev.id}
                        onClick={() => handleApprove(ev.id)}
                      >
                        Approve & Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                        disabled={actionLoading === ev.id}
                        onClick={() => handleReject(ev.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Recent Platform Audit Trail */}
        <div className="space-y-6">
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                Live Audit Stream
              </h3>
              <Link to="/admin/audit" className="text-[11px] text-teal-400 hover:text-teal-300">
                Full Log
              </Link>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-center py-6 text-slate-500 text-xs">No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-800/80 last:border-0 last:pb-0">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        log.action.includes('APPROVED') || log.action.includes('ADMITTED')
                          ? 'bg-emerald-400'
                          : log.action.includes('SUSPENDED') || log.action.includes('REJECTED') || log.action.includes('REVOKED')
                          ? 'bg-rose-400'
                          : 'bg-teal-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-slate-200 font-semibold text-[11px]">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-slate-400 text-[10px] truncate">
                        Target: {log.entityType} ({log.entityId})
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
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
