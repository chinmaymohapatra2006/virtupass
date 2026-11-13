import { inMemoryStore } from '../data/inMemoryStore';
import { Event, EventCategory, EventStatus, TicketCategory } from '../types';

export interface EventFilterOptions {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  sortBy?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'featured';
}

export interface CreateEventInput {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: EventCategory;
  venue: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  bannerUrl?: string;
  ticketSaleStart?: string;
  ticketSaleEnd?: string;
  ticketCategories: {
    name: string;
    description: string;
    basePrice: number;
    totalAllocation: number;
    saleStart?: string;
    saleEnd?: string;
  }[];
}

export class EventsService {
  /**
   * Retrieves public events that are active and approved, applying filters and sorting.
   */
  public getPublicEvents(filters: EventFilterOptions = {}): Event[] {
    let events = inMemoryStore.getAllEvents().filter(
      (e) => e.status === 'PUBLISHED' && e.approvalStatus === 'APPROVED'
    );

    // 1. Keyword Search
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.shortDescription.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (filters.category && filters.category !== 'All') {
      events = events.filter(
        (e) => e.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    // 3. Availability Filter
    if (filters.availableOnly) {
      events = events.filter((e) => e.remainingCapacity > 0);
    }

    // 4. Price Filter (based on lowest ticket category price)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      events = events.filter((e) => {
        const prices = e.ticketCategories.map((tc) => tc.basePrice);
        const minCategoryPrice = Math.min(...prices);
        if (filters.minPrice !== undefined && minCategoryPrice < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice !== undefined && minCategoryPrice > filters.maxPrice) {
          return false;
        }
        return true;
      });
    }

    // 5. Sorting
    switch (filters.sortBy) {
      case 'date_asc':
        events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      case 'date_desc':
        events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        break;
      case 'price_asc':
        events.sort((a, b) => {
          const minA = Math.min(...a.ticketCategories.map((tc) => tc.basePrice));
          const minB = Math.min(...b.ticketCategories.map((tc) => tc.basePrice));
          return minA - minB;
        });
        break;
      case 'price_desc':
        events.sort((a, b) => {
          const maxA = Math.max(...a.ticketCategories.map((tc) => tc.basePrice));
          const maxB = Math.max(...b.ticketCategories.map((tc) => tc.basePrice));
          return maxB - maxA;
        });
        break;
      case 'featured':
      default:
        // Featured events first, then upcoming
        events.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        });
        break;
    }

    return events;
  }

  public getAllEventsForAdmin(): Event[] {
    return inMemoryStore.getAllEvents().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getEventById(id: string): Event | undefined {
    return inMemoryStore.getEventById(id);
  }

  public getFeaturedEvents(): Event[] {
    return this.getPublicEvents({ sortBy: 'featured' }).filter((e) => e.isFeatured);
  }

  public getEventsByOrganizer(organizerId: string): Event[] {
    return inMemoryStore.getEventsByOrganizer(organizerId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createOrganizerEvent(
    organizerId: string,
    organizerName: string,
    collegeName: string,
    input: CreateEventInput
  ): Event {
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowISO = new Date().toISOString();

    const formattedCategories: TicketCategory[] = input.ticketCategories.map((cat, idx) => ({
      id: `tc-${Date.now()}-${idx + 1}`,
      name: cat.name,
      description: cat.description,
      basePrice: cat.basePrice,
      basePricePaise: Math.round(cat.basePrice * 100),
      totalAllocation: cat.totalAllocation,
      remainingAllocation: cat.totalAllocation,
      saleStart: cat.saleStart || nowISO,
      saleEnd: cat.saleEnd || input.eventDate,
      isActive: true
    }));

    const totalCapacity = formattedCategories.reduce((sum, c) => sum + c.totalAllocation, 0);

    const newEvent: Event = {
      id: eventId,
      title: input.title,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      category: input.category,
      organizerId,
      organizerName,
      collegeName,
      venue: input.venue,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime,
      bannerUrl: input.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      ticketSaleStart: input.ticketSaleStart || nowISO,
      ticketSaleEnd: input.ticketSaleEnd || input.eventDate,
      status: 'DRAFT',
      approvalStatus: 'PENDING_APPROVAL',
      ticketCategories: formattedCategories,
      totalCapacity,
      remainingCapacity: totalCapacity,
      isFeatured: false,
      createdAt: nowISO,
      updatedAt: nowISO
    };

    return inMemoryStore.createEvent(newEvent);
  }

  public updateOrganizerEvent(
    organizerId: string,
    eventId: string,
    updates: Partial<CreateEventInput>
  ): Event {
    const existing = inMemoryStore.getEventById(eventId);
    if (!existing) {
      throw new Error(`Event with id '${eventId}' not found`);
    }
    if (existing.organizerId !== organizerId) {
      throw new Error('Unauthorized to modify this event');
    }

    const updated = inMemoryStore.updateEvent(eventId, {
      ...(updates.title && { title: updates.title }),
      ...(updates.shortDescription && { shortDescription: updates.shortDescription }),
      ...(updates.fullDescription && { fullDescription: updates.fullDescription }),
      ...(updates.category && { category: updates.category }),
      ...(updates.venue && { venue: updates.venue }),
      ...(updates.eventDate && { eventDate: updates.eventDate }),
      ...(updates.startTime && { startTime: updates.startTime }),
      ...(updates.endTime && { endTime: updates.endTime }),
      ...(updates.bannerUrl && { bannerUrl: updates.bannerUrl })
    });

    if (!updated) {
      throw new Error('Failed to update event');
    }
    return updated;
  }

  public submitOrganizerEvent(organizerId: string, eventId: string): Event {
    const existing = inMemoryStore.getEventById(eventId);
    if (!existing) {
      throw new Error(`Event with id '${eventId}' not found`);
    }
    if (existing.organizerId !== organizerId) {
      throw new Error('Unauthorized to submit this event');
    }

    const updated = inMemoryStore.updateEvent(eventId, {
      status: 'PENDING_APPROVAL',
      approvalStatus: 'PENDING_APPROVAL'
    });

    if (!updated) {
      throw new Error('Failed to submit event for approval');
    }
    return updated;
  }

  public adminApproveEvent(eventId: string): Event {
    const existing = inMemoryStore.getEventById(eventId);
    if (!existing) {
      throw new Error(`Event with id '${eventId}' not found`);
    }

    const updated = inMemoryStore.updateEvent(eventId, {
      approvalStatus: 'APPROVED',
      status: 'PUBLISHED',
      rejectionReason: undefined
    });

    if (!updated) {
      throw new Error('Failed to approve event');
    }
    return updated;
  }

  public adminRejectEvent(eventId: string, reason: string): Event {
    const existing = inMemoryStore.getEventById(eventId);
    if (!existing) {
      throw new Error(`Event with id '${eventId}' not found`);
    }

    const updated = inMemoryStore.updateEvent(eventId, {
      approvalStatus: 'REJECTED',
      status: 'REJECTED',
      rejectionReason: reason
    });

    if (!updated) {
      throw new Error('Failed to reject event');
    }
    return updated;
  }

  public adminPublishEvent(eventId: string): Event {
    const existing = inMemoryStore.getEventById(eventId);
    if (!existing) {
      throw new Error(`Event with id '${eventId}' not found`);
    }

    const updated = inMemoryStore.updateEvent(eventId, {
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED'
    });

    if (!updated) {
      throw new Error('Failed to publish event');
    }
    return updated;
  }

  public adminCancelEvent(eventId: string, reason?: string): Event {
    const existing = inMemoryStore.getEventById(eventId);
    if (!existing) {
      throw new Error(`Event with id '${eventId}' not found`);
    }

    const updated = inMemoryStore.updateEvent(eventId, {
      status: 'CANCELLED',
      rejectionReason: reason || 'Cancelled by administration'
    });

    if (!updated) {
      throw new Error('Failed to cancel event');
    }
    return updated;
  }
}

export const eventsService = new EventsService();