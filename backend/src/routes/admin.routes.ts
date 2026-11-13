import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { inMemoryStore } from '../data/inMemoryStore';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { eventsService } from '../services/events.service';
import { auditService } from '../services/auditService';
import { analyticsService } from '../services/analyticsService';
import { attendanceService } from '../services/attendanceService';
import { UserStatus, OrganizerApprovalStatus } from '../types';

const rejectEventSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters')
});

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'])
});

const updateOrganizerStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'])
});

const rejectOrganizerSchema = z.object({
  reason: z.string().optional()
});

const revokeTicketSchema = z.object({
  reason: z.string().min(5, 'Revocation reason must be at least 5 characters')
});

export async function adminRoutes(fastify: FastifyInstance) {
  // Enforce ADMIN role on all admin routes
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireRole('ADMIN'));

  // ==========================================
  // 1. ANALYTICS & STATS
  // ==========================================
  fastify.get('/admin/analytics/overview', async (_req, reply) => {
    const analytics = analyticsService.getAdminOverview();
    return reply.send({
      success: true,
      data: analytics
    });
  });

  fastify.get('/admin/summary', async (_req, reply) => {
    const stats = inMemoryStore.getSystemStats();
    return reply.send({
      success: true,
      data: stats
    });
  });

  // ==========================================
  // 2. USER MANAGEMENT
  // ==========================================
  fastify.get('/admin/users', async (request, reply) => {
    const query = request.query as { search?: string; role?: string; status?: string };
    const users = inMemoryStore.getAllUsers(query);
    return reply.send({
      success: true,
      data: users,
      meta: { count: users.length }
    });
  });

  fastify.patch('/admin/users/:userId/status', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const parsed = updateUserStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid status (ACTIVE or SUSPENDED) required' }
      });
    }

    const updated = inMemoryStore.updateUserStatus(userId, parsed.data.status);
    if (!updated) {
      return reply.status(404).send({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: `User '${userId}' not found` }
      });
    }

    auditService.logAction({
      actorId: request.user!.id,
      actorEmail: request.user!.email,
      actorRole: 'ADMIN',
      action: parsed.data.status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      entityType: 'USER',
      entityId: userId,
      metadata: { targetEmail: updated.email, newStatus: parsed.data.status }
    });

    return reply.send({
      success: true,
      data: updated,
      message: `User status changed to ${parsed.data.status}`
    });
  });

  // ==========================================
  // 3. ORGANIZER MANAGEMENT
  // ==========================================
  fastify.get('/admin/organizers', async (_req, reply) => {
    const organizers = inMemoryStore.getAllOrganizers();
    return reply.send({
      success: true,
      data: organizers,
      meta: { count: organizers.length }
    });
  });

  fastify.post('/admin/organizers/:organizerId/approve', async (request, reply) => {
    const { organizerId } = request.params as { organizerId: string };
    const updated = inMemoryStore.updateOrganizerApproval(organizerId, 'APPROVED');
    if (!updated) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORGANIZER_NOT_FOUND', message: `Organizer '${organizerId}' not found` }
      });
    }

    auditService.logAction({
      actorId: request.user!.id,
      actorEmail: request.user!.email,
      actorRole: 'ADMIN',
      action: 'ORGANIZER_APPROVED',
      entityType: 'ORGANIZER',
      entityId: organizerId,
      metadata: { organization: updated.organizationName, email: updated.email }
    });

    return reply.send({
      success: true,
      data: updated,
      message: `Organizer '${updated.fullName}' approved successfully`
    });
  });

  fastify.post('/admin/organizers/:organizerId/reject', async (request, reply) => {
    const { organizerId } = request.params as { organizerId: string };
    const parsed = rejectOrganizerSchema.safeParse(request.body || {});
    const updated = inMemoryStore.updateOrganizerApproval(organizerId, 'REJECTED', parsed.data?.reason);
    if (!updated) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORGANIZER_NOT_FOUND', message: `Organizer '${organizerId}' not found` }
      });
    }

    auditService.logAction({
      actorId: request.user!.id,
      actorEmail: request.user!.email,
      actorRole: 'ADMIN',
      action: 'ORGANIZER_REJECTED',
      entityType: 'ORGANIZER',
      entityId: organizerId,
      metadata: { reason: parsed.data?.reason, email: updated.email }
    });

    return reply.send({
      success: true,
      data: updated,
      message: `Organizer '${updated.fullName}' rejected`
    });
  });

  fastify.patch('/admin/organizers/:organizerId/status', async (request, reply) => {
    const { organizerId } = request.params as { organizerId: string };
    const parsed = updateOrganizerStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid status required' }
      });
    }

    const updated = inMemoryStore.updateUserStatus(organizerId, parsed.data.status);
    if (!updated) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORGANIZER_NOT_FOUND', message: `Organizer '${organizerId}' not found` }
      });
    }

    auditService.logAction({
      actorId: request.user!.id,
      actorEmail: request.user!.email,
      actorRole: 'ADMIN',
      action: parsed.data.status === 'SUSPENDED' ? 'ORGANIZER_SUSPENDED' : 'ORGANIZER_REACTIVATED',
      entityType: 'ORGANIZER',
      entityId: organizerId,
      metadata: { newStatus: parsed.data.status, email: updated.email }
    });

    return reply.send({
      success: true,
      data: updated,
      message: `Organizer status changed to ${parsed.data.status}`
    });
  });

  // ==========================================
  // 4. EVENT MODERATION & PUBLICATION
  // ==========================================
  fastify.get('/admin/events', async (_req, reply) => {
    const events = eventsService.getAllEventsForAdmin();
    return reply.send({
      success: true,
      data: events,
      meta: { count: events.length }
    });
  });

  fastify.post('/admin/events/:eventId/approve', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    try {
      const approved = eventsService.adminApproveEvent(eventId);
      auditService.logAction({
        actorId: request.user!.id,
        actorEmail: request.user!.email,
        actorRole: 'ADMIN',
        action: 'EVENT_APPROVED',
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { title: approved.title }
      });

      return reply.send({
        success: true,
        data: approved,
        message: `Event '${approved.title}' successfully approved and published`
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: err.message }
      });
    }
  });

  fastify.post('/admin/events/:eventId/reject', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const parsed = rejectEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid rejection reason required' }
      });
    }

    try {
      const rejected = eventsService.adminRejectEvent(eventId, parsed.data.reason);
      auditService.logAction({
        actorId: request.user!.id,
        actorEmail: request.user!.email,
        actorRole: 'ADMIN',
        action: 'EVENT_REJECTED',
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { title: rejected.title, reason: parsed.data.reason }
      });

      return reply.send({
        success: true,
        data: rejected,
        message: `Event '${rejected.title}' rejected`
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: err.message }
      });
    }
  });

  fastify.post('/admin/events/:eventId/publish', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    try {
      const published = eventsService.adminPublishEvent(eventId);
      auditService.logAction({
        actorId: request.user!.id,
        actorEmail: request.user!.email,
        actorRole: 'ADMIN',
        action: 'EVENT_PUBLISHED',
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { title: published.title }
      });

      return reply.send({
        success: true,
        data: published,
        message: `Event '${published.title}' published to public catalog`
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: err.message }
      });
    }
  });

  fastify.post('/admin/events/:eventId/cancel', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const { reason } = (request.body as { reason?: string }) || {};
    try {
      const cancelled = eventsService.adminCancelEvent(eventId, reason);
      auditService.logAction({
        actorId: request.user!.id,
        actorEmail: request.user!.email,
        actorRole: 'ADMIN',
        action: 'EVENT_CANCELLED',
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { title: cancelled.title, reason }
      });

      return reply.send({
        success: true,
        data: cancelled,
        message: `Event '${cancelled.title}' marked as CANCELLED`
      });
    } catch (err: any) {
      return reply.status(404).send({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: err.message }
      });
    }
  });

  // ==========================================
  // 5. TICKET MANAGEMENT & REVOCATION
  // ==========================================
  fastify.get('/admin/tickets', async (request, reply) => {
    const { search, status, eventId } = request.query as {
      search?: string;
      status?: string;
      eventId?: string;
    };

    let tickets = inMemoryStore.getAllTickets();
    if (eventId) {
      tickets = tickets.filter((t) => t.eventId === eventId);
    }
    if (status) {
      tickets = tickets.filter((t) => t.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      tickets = tickets.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.eventTitle.toLowerCase().includes(q) ||
          t.ticketCategoryName.toLowerCase().includes(q)
      );
    }

    return reply.send({
      success: true,
      data: tickets,
      meta: { count: tickets.length }
    });
  });

  fastify.post('/admin/tickets/:ticketId/revoke', async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    const parsed = revokeTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid revocation reason required' }
      });
    }

    const revoked = inMemoryStore.revokeTicket(ticketId, parsed.data.reason);
    if (!revoked) {
      return reply.status(404).send({
        success: false,
        error: { code: 'TICKET_NOT_FOUND', message: `Ticket '${ticketId}' not found` }
      });
    }

    auditService.logAction({
      actorId: request.user!.id,
      actorEmail: request.user!.email,
      actorRole: 'ADMIN',
      action: 'TICKET_REVOKED',
      entityType: 'TICKET',
      entityId: ticketId,
      metadata: {
        ticketNumber: revoked.ticketNumber,
        eventTitle: revoked.eventTitle,
        reason: parsed.data.reason
      }
    });

    return reply.send({
      success: true,
      data: revoked,
      message: `Pass '${revoked.ticketNumber}' has been revoked`
    });
  });

  // ==========================================
  // 6. BOOKINGS & PAYMENTS
  // ==========================================
  fastify.get('/admin/bookings', async (_req, reply) => {
    inMemoryStore.sweepExpiredBookings();
    const bookings = inMemoryStore.getAllBookings();
    return reply.send({
      success: true,
      data: bookings,
      meta: { count: bookings.length }
    });
  });

  fastify.get('/admin/payments', async (_req, reply) => {
    const payments = inMemoryStore.getAllPayments();
    return reply.send({
      success: true,
      data: payments,
      meta: { count: payments.length }
    });
  });

  // ==========================================
  // 7. AUDIT LOGS
  // ==========================================
  fastify.get('/admin/audit', async (request, reply) => {
    const { action, entityType, actorId, limit } = request.query as {
      action?: string;
      entityType?: string;
      actorId?: string;
      limit?: string;
    };

    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const logs = auditService.getLogs(
      { action, entityType, actorId },
      isNaN(parsedLimit) ? 50 : parsedLimit
    );

    return reply.send({
      success: true,
      data: logs,
      meta: { count: logs.length }
    });
  });
}
