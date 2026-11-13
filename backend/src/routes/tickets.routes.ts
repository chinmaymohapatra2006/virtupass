import { FastifyInstance } from 'fastify';
import {
  getMyTicketsHandler,
  getTicketByIdHandler,
  getTicketQrHandler,
  downloadTicketHandler
} from '../controllers/tickets.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export async function ticketsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Student tickets list
  fastify.get('/tickets/my', { preHandler: [requireRole('USER')] }, getMyTicketsHandler);

  // Individual ticket operations (enforces ownership or ADMIN)
  fastify.get('/tickets/:ticketId', getTicketByIdHandler);
  fastify.get('/tickets/:ticketId/qr', getTicketQrHandler);
  fastify.get('/tickets/:ticketId/download', downloadTicketHandler);
}