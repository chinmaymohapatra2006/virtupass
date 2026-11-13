import React, { useState } from 'react';
import { PageHeader } from '../shared/components/PageHeader';
import { EventCard } from '../shared/components/EventCard';
import { Input } from '../shared/components/Input';
import { LoadingState } from '../shared/components/LoadingState';
import { ErrorState } from '../shared/components/ErrorState';
import { EmptyState } from '../shared/components/EmptyState';
import { useEvents } from '../shared/hooks/useApi';
import { Search, Filter, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { EventFilterParams } from '../shared/services/apiClient';

export const ExploreEventsPage: React.FC = () => {
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<EventFilterParams['sortBy']>('featured');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);

  const filters: EventFilterParams = {
    category: category === 'All' ? undefined : category,
    search: search.trim() ? search.trim() : undefined,
    sortBy,
    availableOnly: availableOnly || undefined
  };

  const { data: events, isLoading, isError, refetch } = useEvents(filters);

  const categories = [
    'All',
    'Technical',
    'Cultural',
    'Music',
    'Gaming',
    'Workshop',
    'Dance'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <PageHeader
          title="Campus Events & Tech Symposia"
          description="Explore inter-collegiate hackathons, cultural festivals, esports arenas, and technical workshops across top institutions."
        />
        
        {/* Academic Benefit Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-brand-950/80 via-slate-900 to-slate-900 border border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>
              <strong className="text-white font-semibold">Institutional Merit Advantage:</strong> Verified university students receive up to <span className="text-emerald-400 font-bold">20% direct academic discount</span> on all festival passes.
            </span>
          </div>
          <div className="text-[11px] text-slate-400 shrink-0 font-medium bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            Rule: &gt;9.5: 20% | 9.0–9.5: 15% | 8.5–9.0: 10%
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="w-full lg:w-80">
          <Input
            placeholder="Search events, venues, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                category === cat
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort and Availability Controls */}
        <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="featured" className="bg-slate-900">Featured First</option>
              <option value="date_asc" className="bg-slate-900">Date: Earliest</option>
              <option value="date_desc" className="bg-slate-900">Date: Latest</option>
              <option value="price_asc" className="bg-slate-900">Price: Low to High</option>
              <option value="price_desc" className="bg-slate-900">Price: High to Low</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
            />
            <span>Available only</span>
          </label>
        </div>
      </div>

      {/* Event Cards Grid */}
      {isLoading ? (
        <LoadingState message="Fetching campus events from VirtuPass API..." />
      ) : isError ? (
        <ErrorState
          title="Could not connect to VirtuPass backend"
          message="Ensure the backend server is running at http://localhost:4000"
          onRetry={() => refetch()}
        />
      ) : (events || []).length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try adjusting your search criteria, category selection, or filters."
          actionText="Reset All Filters"
          onAction={() => {
            setCategory('All');
            setSearch('');
            setSortBy('featured');
            setAvailableOnly(false);
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