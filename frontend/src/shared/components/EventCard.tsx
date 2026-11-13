import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { Event } from '../types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { formatCurrency, formatDate } from '../utils/formatters';

export interface EventCardProps {
  event: Event;
  showAdminActions?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const categories = event.ticketCategories || [];
  const minPrice = categories.length > 0 ? Math.min(...categories.map((t) => t.basePrice)) : 0;
  const isSoldOut = event.remainingCapacity <= 0;

  return (
    <Card variant="interactive" padding="none" className="overflow-hidden flex flex-col h-full border-slate-800/80 bg-slate-900/60 hover:border-brand-500/50 transition-all duration-300">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={event.bannerUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/40" />
        
        {/* Category & Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge variant="brand">{event.category}</Badge>
          {event.isFeatured && (
            <Badge variant="warning" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Featured
            </Badge>
          )}
          {isSoldOut && (
            <Badge variant="danger">Sold Out</Badge>
          )}
        </div>

        {/* CGPA Academic Merit Discount Banner */}
        <div className="absolute bottom-3 left-3 right-3 bg-brand-950/90 backdrop-blur-md border border-brand-500/40 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs text-brand-300 shadow-md">
          <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
            <Tag className="w-3.5 h-3.5" /> Up to 20% Merit Discount
          </span>
          <span className="text-[11px] text-brand-300/90 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-brand-400" /> CGPA &gt; 8.5
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-xs text-brand-400/90 font-medium mb-1 truncate">{event.collegeName}</div>
          <h3 className="text-lg font-bold text-white leading-snug line-clamp-1 hover:text-brand-400 transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {event.shortDescription || event.fullDescription}
          </p>

          <div className="mt-4 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{formatDate(event.eventDate)} • {event.startTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className={event.remainingCapacity < 50 ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                {event.remainingCapacity} / {event.totalCapacity} passes left
              </span>
            </div>
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Passes From</div>
            <div className="text-lg font-black text-white">
              {minPrice === 0 ? 'Free' : formatCurrency(minPrice)}
            </div>
          </div>
          <Link to={`/events/${event.id}`}>
            <Button size="sm" variant={isSoldOut ? 'outline' : 'primary'} disabled={isSoldOut}>
              {isSoldOut ? 'Sold Out' : 'Select Passes'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};