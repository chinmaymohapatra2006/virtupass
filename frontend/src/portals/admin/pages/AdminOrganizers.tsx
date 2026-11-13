import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { useAdminOrganizers } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  UserX,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';

export const AdminOrganizers: React.FC = () => {
  const { data: organizers = [], isLoading, refetch } = useAdminOrganizers();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApprove = async (organizerId: string) => {
    setActionLoading(organizerId);
    try {
      await apiClient.approveOrganizer(organizerId);
      refetch();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (organizerId: string) => {
    const reason = prompt('Please specify rejection reason for this organizer application:');
    if (!reason || reason.trim().length < 5) {
      alert('Rejection reason must be at least 5 characters');
      return;
    }

    setActionLoading(organizerId);
    try {
      await apiClient.rejectOrganizer(organizerId, reason.trim());
      refetch();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (organizerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const confirmMsg =
      nextStatus === 'SUSPENDED'
        ? 'Suspend this organizer? They will not be able to host events or scan gate passes.'
        : 'Reactivate this organizer?';

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(organizerId);
    try {
      await apiClient.updateOrganizerStatus(organizerId, nextStatus as any);
      refetch();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = organizers.filter((org) => {
    if (statusFilter === 'ALL') return true;
    return org.approvalStatus === statusFilter;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="College Organizers & Clubs"
        description="Vetted student councils, technical societies, and cultural associations with fest publishing & gate scanning privileges."
        badge={<Badge variant="brand">{organizers.length} Registered Organizations</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <option value="ALL">All Statuses ({organizers.length})</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        }
      />

      {/* Organizers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
            Loading organizers registry...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
            No organizers found in this filter.
          </div>
        ) : (
          filtered.map((org) => (
            <Card key={org.id} variant="default" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {org.organizationName || org.fullName}
                      </h4>
                      <p className="text-xs text-slate-400">{org.collegeName || 'Collegiate Host'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        org.approvalStatus === 'APPROVED'
                          ? 'success'
                          : org.approvalStatus === 'PENDING_APPROVAL'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {org.approvalStatus || 'PENDING'}
                    </Badge>
                    {org.status === 'SUSPENDED' && (
                      <Badge variant="danger" className="text-[10px]">
                        SUSPENDED
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Primary Contact Lead:</span>
                    <span className="font-bold text-white">{org.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" /> Email:
                    </span>
                    <span className="font-mono text-slate-300">{org.email}</span>
                  </div>
                  {org.contactNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" /> Phone:
                      </span>
                      <span className="font-mono text-slate-300">{org.contactNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={actionLoading === org.id}
                  onClick={() => handleToggleSuspend(org.id, org.status)}
                  className={
                    org.status === 'ACTIVE'
                      ? 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs'
                      : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs'
                  }
                  leftIcon={
                    org.status === 'ACTIVE' ? (
                      <UserX className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {org.status === 'ACTIVE' ? 'Suspend Club' : 'Reactivate'}
                </Button>

                <div className="flex items-center gap-2">
                  {org.approvalStatus !== 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                      isLoading={actionLoading === org.id}
                      onClick={() => handleApprove(org.id)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve Host
                    </Button>
                  )}
                  {org.approvalStatus !== 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs"
                      isLoading={actionLoading === org.id}
                      onClick={() => handleReject(org.id)}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
