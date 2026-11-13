import React, { useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { EventCard } from '../../../shared/components/EventCard';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useEvents } from '../../../shared/hooks/useApi';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Sparkles, Filter, Search, ShieldCheck } from 'lucide-react';
import { Input } from '../../../shared/components/Input';
import { EventFilterParams } from '../../../shared/services/apiClient';

export const UserEvents: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filters: EventFilterParams = {
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    search: searchQuery.trim() ? searchQuery.trim() : undefined
  };

  const { data: events, isLoading, isError, refetch } = useEvents(filters);

  const categories = ['All', 'Technical', 'Cultural', 'Music', 'Gaming', 'Workshop', 'Dance'];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Event Directory"
        description="Discover inter-college festivals, national hackathons, and technical symposiums with your auto-applied CGPA merit discounts."
        badge={
          user?.isVerified ? (
            <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> CGPA {user.cgpa?.toFixed(2)} Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Unverified (0% Discount)
            </span>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search events, colleges, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-thin">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      {isLoading ? (
        <LoadingState message="Fetching campus events from VirtuPass backend..." />
      ) : isError ? (
        <ErrorState
          title="Could not load events"
          message="Ensure your backend is running at http://localhost:4000."
          onRetry={() => refetch()}
        />
      ) : (events || []).length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try adjusting your category filter or search keywords."
          actionText="Reset Filters"
          onAction={() => {
            setSelectedCategory('All');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(events || []).map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
};