import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { useAttendance, useAttendanceStats, useAdminEvents } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';
import {
  BarChart3,
  ScanLine,
  Activity,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('ALL');

  const { data: events = [] } = useAdminEvents();
  const { data: stats } = useAttendanceStats(selectedEventId || undefined);
  const { data: records = [], isLoading } = useAttendance({
    eventId: selectedEventId || undefined,
    search: search || undefined,
    scanResult: resultFilter !== 'ALL' ? (resultFilter as any) : undefined
  });

  const exportUrl = apiClient.getAttendanceExportUrl(selectedEventId || undefined);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campus Gate Attendance & Live Telemetry"
        description="Platform-wide entrance throughput, scanner activity, and security gate turnstile validations."
        badge={
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5" /> Platform Gate Live
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <a
              href={exportUrl}
              download
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export CSV</span>
            </a>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Total Turnstile Scans</p>
          <h3 className="text-2xl font-black text-white mt-1">{stats?.totalScans ?? records.length}</h3>
          <p className="text-xs text-slate-500 mt-1">Platform-wide scan logs</p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Admitted Passes</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats?.admitted ?? 0}</h3>
          <p className="text-xs text-emerald-400/80 mt-1">{stats?.admittedRate ?? 0}% Entry Success</p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Duplicate Scan Blocks</p>
          <h3 className="text-2xl font-black text-amber-400 mt-1">{stats?.duplicates ?? 0}</h3>
          <p className="text-xs text-amber-400/80 mt-1">Anti-passback enforced</p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Invalid / Void Attempts</p>
          <h3 className="text-2xl font-black text-rose-400 mt-1">
            {(stats?.invalid ?? 0) + (stats?.wrongEvent ?? 0)}
          </h3>
          <p className="text-xs text-rose-400/80 mt-1">Wrong fest or counterfeit</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="glass" padding="md">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendee, ticket number, event, gate..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <option value="">All Platform Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <option value="ALL">All Scan Outcomes</option>
              <option value="ADMITTED">ADMITTED</option>
              <option value="DUPLICATE">DUPLICATE</option>
              <option value="WRONG_EVENT">WRONG_EVENT</option>
              <option value="REVOKED">REVOKED</option>
              <option value="INVALID">INVALID</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Attendee</th>
                <th className="py-3 px-4">Ticket Number</th>
                <th className="py-3 px-4">Event & Category</th>
                <th className="py-3 px-4">Gate Checkpoint</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Scanned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Loading attendance telemetry...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{r.attendeeName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.attendeeEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-400">{r.ticketNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium truncate max-w-xs">{r.eventTitle}</div>
                      <div className="text-[10px] text-slate-400">{r.ticketCategoryName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{r.gateName}</td>
                    <td className="py-3.5 px-4">
                      {r.scanResult === 'ADMITTED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> ADMITTED
                        </span>
                      ) : r.scanResult === 'DUPLICATE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> DUPLICATE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> {r.scanResult}
                        </span>
                      )}
                      {r.failureReason && (
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">
                          {r.failureReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(r.scannedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
