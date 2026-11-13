import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { useAdminAuditLogs } from '../../../shared/hooks/useApi';
import { ShieldAlert, Lock, Terminal, RefreshCw, Filter } from 'lucide-react';

export const AdminAudit: React.FC = () => {
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const { data: logs = [], isLoading, refetch } = useAdminAuditLogs({
    entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
    limit: 100
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('ADMITTED') || action.includes('REACTIVATED')) {
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
    if (action.includes('SUSPENDED') || action.includes('REJECTED') || action.includes('REVOKED')) {
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    }
    if (action.includes('SUBMITTED') || action.includes('PUBLISHED')) {
      return 'bg-teal-500/20 text-teal-400 border border-teal-500/30';
    }
    return 'bg-slate-800 text-slate-300 border border-slate-700';
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security & System Audit Log"
        description="Immutable administrative action logs, authentication events, ticket revocations, and gate security exceptions."
        badge={<Badge variant="neutral">In-Memory Audit Trail Active</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <option value="ALL">All Entities ({logs.length})</option>
              <option value="USER">USER</option>
              <option value="ORGANIZER">ORGANIZER</option>
              <option value="EVENT">EVENT</option>
              <option value="TICKET">TICKET</option>
              <option value="ATTENDANCE">ATTENDANCE</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <Card variant="default" padding="none" className="overflow-hidden font-mono text-xs shadow-2xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Terminal className="w-4 h-4 text-brand-400" />
            <span className="font-bold">VirtuPass Audit Journal Buffer</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Showing {logs.length} journaled events
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No audit logs matching this entity filter.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-900/40 transition"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action.replace(/_/g, ' ')}
                  </span>

                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Target: {log.entityType} ({log.entityId})</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        by {log.actorRole} ({log.actorEmail || log.actorId})
                      </span>
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap gap-2">
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-block px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]"
                          >
                            <span className="text-slate-500">{k}:</span>{' '}
                            <span className="text-teal-300 font-semibold">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left md:text-right text-[11px] text-slate-500 shrink-0 font-mono">
                  <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                  <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
