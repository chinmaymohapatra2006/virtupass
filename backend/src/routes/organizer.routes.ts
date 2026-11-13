import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { inMemoryStore } from '../data/inMemoryStore';
import { authenticate, requireRole, requireApprovedOrganizer } from '../middleware/auth.middleware';
import { eventsService } from '../services/events.service';
import { auditService } from '../services/auditService';
import { analyticsService } from '../services/analyticsService';

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(5, 'Short description must be at least 5 characters'),
  fullDescription: z.string().min(10, 'Full description must be at least 10 characters'),
  category: z.enum([
    'Technical',
    'Cultural',
    'Music',
    'Dance',
    'Sports',
    'Gaming',
    'Workshop',
    'Seminar',
    'Entrepreneurship',
    'Other'
  ]),
  venue: z.string().min(3, 'Venue must be at least 3 characters'),
  eventDate: z.string().min(5, 'Event date is required'),
  startTime: z.string().min(2, 'Start time is required'),
  endTime: z.string().min(2, 'End time is required'),
  bannerUrl: z.string().url().optional(),
  ticketSaleStart: z.string().optional(),
  ticketSaleEnd: z.string().optional(),
  ticketCategories: z.array(
    z.object({
      name: z.string().min(2, 'Category name required'),
      description: z.string().min(3, 'Category description required'),
      basePrice: z.number().nonnegative('Base price must be >= 0'),
      totalAllocation: z.number().int().positive('Allocation must be > 0'),
      saleStart: z.string().optional(),
      saleEnd: z.string().optional()
    })
  ).min(1, 'At least one ticket category is required')
});

export async function organizerRoutes(fastify: FastifyInstance) {
  // Enforce ORGANIZER role on all organizer routes
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireRole('ORGANIZER'));

  // Organizer profile
  fastify.get('/organizer/me', async (request, reply) => {
    return reply.send({
      success: true,
      data: request.user
    });
  });

  // Organizer Analytics Overview
  fastify.get('/organizer/analytics/overview', async (request, reply) => {
    const analytics = analyticsService.getOrganizerOverview(request.user!.id);
    return reply.send({
      success: true,
      data: analytics
    });
  });

  // Get all events owned by this organizer
  fastify.get('/organizer/events', async (request, reply) => {
    const events = eventsService.getEventsByOrganizer(request.user!.id);
    return reply.send({
      success: true,
      data: events,
      meta: { count: events.length }
    });
  });

  // Create a new event (Approved organizers only)
  fastify.post(
    '/organizer/events',
    { preHandler: [requireApprovedOrganizer] },
    async (request, reply) => {
      const parsed = createEventSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid event data',
            details: parsed.error.format()
          }
        });
      }

      try {
        const event = eventsService.createOrganizerEvent(
          request.user!.id,
          request.user!.organizationName || request.user!.fullName,
          request.user!.collegeName || 'Host University',
          parsed.data
        );

        auditService.logAction({
          actorId: request.user!.id,
          actorEmail: request.user!.email,
          actorRole: 'ORGANIZER',
          action: 'EVENT_SUBMITTED',
          entityType: 'EVENT',
          entityId: event.id,
          metadata: { title: event.title, status: event.status }
        });

        return reply.status(201).send({
          success: true,
          data: event
        });
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'EVENT_CREATION_FAILED',
            message: err.message
          }
        });
      }
    }
  );

  // Submit event for admin approval
  fastify.post('/organizer/events/:eventId/submit', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    try {
      const updated = eventsService.submitOrganizerEvent(request.user!.id, eventId);

      auditService.logAction({
        actorId: request.user!.id,
        actorEmail: request.user!.email,
        actorRole: 'ORGANIZER',
        action: 'EVENT_SUBMITTED',
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { title: updated.title }
      });

      return reply.send({
        success: true,
        data: updated,
        message: 'Event submitted for administrative review'
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SUBMISSION_FAILED',
          message: err.message
        }
      });
    }
  });

  // Organizer Bookings View (Scoped strictly to this organizer's events)
  fastify.get('/organizer/bookings', async (request, reply) => {
    inMemoryStore.sweepExpiredBookings();
    const myEvents = eventsService.getEventsByOrganizer(request.user!.id);
    const myEventIds = new Set(myEvents.map((e) => e.id));

    const allBookings = inMemoryStore.getAllBookings();
    const organizerBookings = allBookings.filter((b) => myEventIds.has(b.eventId));

    return reply.send({
      success: true,
      data: organizerBookings,
      meta: { count: organizerBookings.length }
    });
  });

  // Organizer Tickets View (Scoped strictly to this organizer's events)
  fastify.get('/organizer/tickets', async (request, reply) => {
    const myEvents = eventsService.getEventsByOrganizer(request.user!.id);
    const myEventIds = new Set(myEvents.map((e) => e.id));

    const allTickets = inMemoryStore.getAllTickets();
    const organizerTickets = allTickets.filter((t) => myEventIds.has(t.eventId));

    return reply.send({
      success: true,
      data: organizerTickets,
      meta: { count: organizerTickets.length }
    });
  });
}
