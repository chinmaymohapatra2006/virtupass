import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useOrganizerEvents } from '../../../shared/hooks/useApi';
import { apiClient } from '../../../shared/services/apiClient';
import { PlusCircle, Calendar, MapPin, Users, Send, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatters';

export const OrganizerEvents: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { data: events, isLoading, isError, refetch } = useOrganizerEvents();

  const handleSubmitting = async (eventId: string) => {
    setSubmittingId(eventId);
    setActionMessage(null);
    try {
      await apiClient.submitOrganizerEvent(eventId);
      setActionMessage('Event successfully submitted for administrative review!');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to submit event for review');
    } finally {
      setSubmittingId(null);
    }
  };

  const myEvents = events || [];

  const filtered = myEvents.filter((e) => {
    if (filter === 'published') return e.status === 'PUBLISHED';
    if (filter === 'draft') return e.status === 'DRAFT' || e.status === 'PENDING_APPROVAL';
    return true;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="College Festivals & Events"
        description="Manage festival listings, ticket allocations, and submit draft proposals for administrative approval."
        actions={
          <Link to="/organizer/events/new">
            <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Fest
            </Button>
          </Link>
        }
      />

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({myEvents.length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'published' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Published ({myEvents.filter((e) => e.status === 'PUBLISHED').length})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'draft' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Draft / Pending ({myEvents.filter((e) => e.status === 'DRAFT' || e.status === 'PENDING_APPROVAL').length})
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading organizer events from VirtuPass store..." />
      ) : isError ? (
        <ErrorState
          title="Could not load organizer events"
          message="Ensure your organizer credentials are valid and the backend server is reachable."
          onRetry={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Create your first college festival or symposium to start issuing passes."
          actionText="Create Fest"
          onAction={() => window.location.href = '/organizer/events/new'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((evt) => (
            <Card key={evt.id} variant="default" padding="md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="brand">{evt.category}</Badge>
                    <h3 className="text-base font-bold text-white">{evt.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(evt.eventDate)}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {evt.venue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      evt.status === 'PUBLISHED'
                        ? 'success'
                        : evt.status === 'PENDING_APPROVAL'
                        ? 'warning'
                        : evt.status === 'REJECTED'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {evt.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-[11px] text-slate-500 font-mono">{evt.approvalStatus}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-4">
                  <span>Passes Left: <strong className="text-white">{evt.remainingCapacity} / {evt.totalCapacity}</strong></span>
                  <span>Tiers: <strong className="text-brand-300">{evt.ticketCategories.length} categories</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {evt.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                      isLoading={submittingId === evt.id}
                      onClick={() => handleSubmitting(evt.id)}
                    >
                      Submit for Approval
                    </Button>
                  )}
                  <Link to={`/events/${evt.id}`}>
                    <Button size="sm" variant="ghost">
                      Public View
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};