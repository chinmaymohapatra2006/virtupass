import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { useAdminEvents } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';
import { Check, X, ShieldCheck, AlertCircle, Ban, Globe } from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatters';

export const AdminEvents: React.FC = () => {
  const { data: events, isLoading, isError, refetch } = useAdminEvents();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleApprove = async (eventId: string, title: string) => {
    setProcessingId(eventId);
    try {
      await apiClient.approveAdminEvent(eventId);
      setFeedbackMsg(`Event "${title}" approved and published to public catalog.`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to approve event');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublish = async (eventId: string, title: string) => {
    setProcessingId(eventId);
    try {
      await apiClient.publishAdminEvent(eventId);
      setFeedbackMsg(`Event "${title}" published.`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to publish event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (eventId: string, title: string) => {
    const reason = prompt(`Enter rejection reason for "${title}":`, 'Requires complete schedule and security plan.');
    if (!reason || reason.trim().length < 5) {
      alert('Rejection reason must be at least 5 characters');
      return;
    }

    setProcessingId(eventId);
    try {
      await apiClient.rejectAdminEvent(eventId, reason.trim());
      setFeedbackMsg(`Event "${title}" has been rejected.`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to reject event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (eventId: string, title: string) => {
    const reason = prompt(`Enter cancellation reason for "${title}":`, 'Host campus emergency cancellation.');
    if (!reason) return;

    setProcessingId(eventId);
    try {
      await apiClient.cancelAdminEvent(eventId, reason.trim());
      setFeedbackMsg(`Event "${title}" cancelled.`);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel event');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = (events || []).filter((e) => {
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Event Oversight & Approval Hub"
        description="Review all published, pending, and draft collegiate events across platform institutions."
        badge={<Badge variant="warning">Oversight Mode</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            >
              <option value="ALL">All Event Statuses ({(events || []).length})</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        }
      />

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Fetching all platform events..." />
      ) : isError ? (
        <ErrorState
          title="Could not load admin events"
          message="Ensure your administrator session is active and valid."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No events found matching status filter.
            </div>
          ) : (
            filtered.map((evt) => (
              <Card key={evt.id} variant="default" padding="md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="brand">{evt.category}</Badge>
                      <h4 className="text-base font-bold text-white">{evt.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {evt.collegeName} • Organized by {evt.organizerName} ({evt.organizerId})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {evt.remainingCapacity} / {evt.totalCapacity} Passes Left
                    </span>
                    <Badge
                      variant={
                        evt.status === 'PUBLISHED'
                          ? 'success'
                          : evt.status === 'PENDING_APPROVAL'
                          ? 'warning'
                          : evt.status === 'REJECTED' || evt.status === 'CANCELLED'
                          ? 'danger'
                          : 'neutral'
                      }
                    >
                      {evt.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 text-slate-400">
                    <p>Venue: <span className="text-slate-200">{evt.venue}</span></p>
                    <p>Date: <span className="text-slate-200">{formatDate(evt.eventDate)} ({evt.startTime} - {evt.endTime})</span></p>
                    <p className="text-brand-300">
                      Ticket Tiers: {evt.ticketCategories.map((c) => `${c.name} (₹${c.basePrice})`).join(' • ')}
                    </p>
                    {evt.rejectionReason && (
                      <p className="text-rose-400 font-semibold">Moderation Note: {evt.rejectionReason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {evt.approvalStatus !== 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-500"
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        isLoading={processingId === evt.id}
                        onClick={() => handleApprove(evt.id, evt.title)}
                      >
                        Approve & Publish
                      </Button>
                    )}
                    {evt.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Globe className="w-3.5 h-3.5" />}
                        isLoading={processingId === evt.id}
                        onClick={() => handlePublish(evt.id, evt.title)}
                      >
                        Publish Catalog
                      </Button>
                    )}
                    {evt.status !== 'REJECTED' && evt.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<X className="w-3.5 h-3.5" />}
                        isLoading={processingId === evt.id}
                        onClick={() => handleReject(evt.id, evt.title)}
                      >
                        Reject
                      </Button>
                    )}
                    {evt.status === 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                        leftIcon={<Ban className="w-3.5 h-3.5" />}
                        isLoading={processingId === evt.id}
                        onClick={() => handleCancel(evt.id, evt.title)}
                      >
                        Cancel Event
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
