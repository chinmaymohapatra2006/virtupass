import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes';
import { systemRoutes } from './system.routes';
import { eventsRoutes } from './events.routes';
import { authRoutes } from './auth.routes';
import { verificationRoutes } from './verification.routes';
import { adminRoutes } from './admin.routes';
import { organizerRoutes } from './organizer.routes';
import { bookingsRoutes } from './bookings.routes';
import { paymentsRoutes } from './payments.routes';
import { ticketsRoutes } from './tickets.routes';
import { attendanceRoutes } from './attendance.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Mount all v1 endpoints under /api/v1
  await fastify.register(
    async (v1) => {
      await v1.register(healthRoutes);
      await v1.register(systemRoutes);
      await v1.register(eventsRoutes);
      await v1.register(authRoutes);
      await v1.register(verificationRoutes);
      await v1.register(adminRoutes);
      await v1.register(organizerRoutes);
      await v1.register(bookingsRoutes);
      await v1.register(paymentsRoutes);
      await v1.register(ticketsRoutes);
      await v1.register(attendanceRoutes);
    },
    { prefix: '/api/v1' }
  );

  // Root fallback route
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      name: 'VirtuPass Backend API',
      status: 'operational',
      documentation: '/api/v1/system/info',
      health: '/api/v1/health'
    });
  });
}
