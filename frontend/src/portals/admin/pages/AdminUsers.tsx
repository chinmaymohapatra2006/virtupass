import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useAdminUsers } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';
import { Users, Search, CheckCircle2, ShieldAlert, ShieldCheck, UserX, UserCheck } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: users = [], isLoading, refetch } = useAdminUsers();

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const confirmMsg = nextStatus === 'SUSPENDED'
      ? 'Are you sure you want to suspend this user? They will be locked out and their session tokens revoked.'
      : 'Reactivate this user account?';

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(userId);
    try {
      await apiClient.updateUserStatus(userId, nextStatus as any);
      refetch();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.collegeName && u.collegeName.toLowerCase().includes(search.toLowerCase())) ||
      (u.studentId && u.studentId.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="User & Student Directory"
        description="Comprehensive directory of registered university attendees, institutional domain validations, and CGPA audit records."
        badge={<Badge variant="info">{users.length} Total Users</Badge>}
      />

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name, college, email, student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">USER (Student)</option>
            <option value="ORGANIZER">ORGANIZER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>

          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing {filtered.length} of {users.length}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User Identity</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">College / Club</th>
                <th className="px-5 py-3.5">Academic Verification</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No users match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-xs">{u.fullName}</div>
                      <div className="text-slate-400 text-[10px] font-mono">{u.email}</div>
                      {u.studentId && (
                        <div className="text-[10px] text-teal-400 font-mono">ID: {u.studentId}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          u.role === 'ADMIN' ? 'warning' : u.role === 'ORGANIZER' ? 'info' : 'neutral'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      {u.organizationName || u.collegeName || 'General Attendee'}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isVerified ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>CGPA {u.cgpa?.toFixed(2) || 'Verified'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Unverified</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={actionLoading === u.id}
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={
                            u.status === 'ACTIVE'
                              ? 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs'
                              : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs'
                          }
                          leftIcon={
                            u.status === 'ACTIVE' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )
                          }
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
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
    </div>
  );
};
