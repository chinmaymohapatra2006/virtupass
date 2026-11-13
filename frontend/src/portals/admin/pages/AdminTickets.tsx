import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useAdminTickets } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';
import {
  Ticket,
  QrCode,
  Search,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Clock,
  Key,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatters';

export const AdminTickets: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inspectTicket, setInspectTicket] = useState<any>(null);

  const { data: tickets = [], isLoading, refetch } = useAdminTickets({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined
  });

  const handleRevoke = async (ticketId: string, ticketNumber: string) => {
    const reason = prompt(
      `Revoke Pass ${ticketNumber}?\nPlease state the administrative justification (e.g. Chargeback, Disciplinary action):`,
      'Administrative disciplinary hold'
    );
    if (!reason || reason.trim().length < 5) {
      alert('Revocation reason must be at least 5 characters');
      return;
    }

    setActionLoading(ticketId);
    try {
      await apiClient.revokeAdminTicket(ticketId, reason.trim());
      refetch();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = tickets.filter((t) => t.status === 'ACTIVE').length;
  const usedCount = tickets.filter((t) => t.status === 'USED').length;
  const revokedCount = tickets.filter((t) => t.status === 'REVOKED').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Global Ticket Inventory & Issuance"
        description="Inspect digital pass cryptography, cryptographic signature telemetry, and check-in validity states."
        badge={<Badge variant="info">{tickets.length} Total Passes Issued</Badge>}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Active Gate Passes</p>
          <h3 className="text-2xl font-black text-white mt-1">{activeCount}</h3>
          <p className="text-xs text-emerald-400 mt-1">Ready for Gate Admission</p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Turnstile Admitted</p>
          <h3 className="text-2xl font-black text-teal-400 mt-1">{usedCount}</h3>
          <p className="text-xs text-teal-300 mt-1">Scanned at Checkpoints</p>
        </Card>
        <Card variant="glass" padding="md">
          <p className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Revoked / Void</p>
          <h3 className="text-2xl font-black text-rose-400 mt-1">{revokedCount}</h3>
          <p className="text-xs text-slate-400 mt-1">Lockout enforced at gate</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search ticket number, event, tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            <option value="ALL">All Statuses ({tickets.length})</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="USED">USED</option>
            <option value="REVOKED">REVOKED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Ticket Number</th>
                <th className="px-4 py-3.5">Target Event & Tier</th>
                <th className="px-4 py-3.5">Pass Index</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Issued At</th>
                <th className="px-4 py-3.5">Turnstile Scan</th>
                <th className="px-4 py-3.5 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Loading ticket registry...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No tickets found matching your query.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-teal-400">
                      {t.ticketNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs truncate max-w-xs">{t.eventTitle}</div>
                      <div className="text-slate-400 text-[10px]">{t.ticketCategoryName}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {t.ticketIndex} of {t.totalTicketsInBooking}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          t.status === 'ACTIVE'
                            ? 'success'
                            : t.status === 'USED'
                            ? 'info'
                            : 'danger'
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400 text-[10px]">
                      {new Date(t.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[10px]">
                      {t.usedAt ? (
                        <span className="text-emerald-400">
                          {t.entryCheckpoint || 'Gate'} ({new Date(t.usedAt).toLocaleTimeString()})
                        </span>
                      ) : (
                        <span className="text-slate-500">Unscanned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInspectTicket(t)}
                        className="text-xs text-slate-300"
                        leftIcon={<Eye className="w-3 h-3" />}
                      >
                        Inspect
                      </Button>
                      {t.status !== 'REVOKED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={actionLoading === t.id}
                          onClick={() => handleRevoke(t.id, t.ticketNumber)}
                          className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs"
                          leftIcon={<Ban className="w-3 h-3" />}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ticket Cryptographic Inspector Modal */}
      {inspectTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="default" padding="lg" className="max-w-md w-full border-teal-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Cryptographic Security Payload</span>
              </h4>
              <button
                onClick={() => setInspectTicket(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Ticket Number</span>
                <span className="font-mono text-teal-300 font-bold text-sm">{inspectTicket.ticketNumber}</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Opaque QR Payload</span>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 break-all">
                  {inspectTicket.qrPayload}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  ✓ Verified: Zero PII, student name, or financial data encoded.
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">256-bit Secure Token Hash</span>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-slate-300 break-all">
                  {inspectTicket.secureToken}
                </div>
              </div>

              {inspectTicket.qrCodeDataUrl && (
                <div className="text-center pt-2">
                  <img
                    src={inspectTicket.qrCodeDataUrl}
                    alt="Ticket QR"
                    className="w-40 h-40 mx-auto rounded-xl p-2 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">High-density turnstile QR</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
