import { FastifyInstance } from 'fastify';
import {
  createQuoteHandler,
  initiateBookingHandler,
  getMyBookingsHandler,
  getBookingByIdHandler
} from '../controllers/bookings.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export async function bookingsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Student-specific booking operations
  fastify.post('/bookings/quote', { preHandler: [requireRole('USER')] }, createQuoteHandler);
  fastify.post('/bookings', { preHandler: [requireRole('USER')] }, initiateBookingHandler);
  fastify.get('/bookings/my', { preHandler: [requireRole('USER')] }, getMyBookingsHandler);

  // Specific booking retrieval (enforces ownership or ADMIN internally)
  fastify.get('/bookings/:bookingId', getBookingByIdHandler);
}