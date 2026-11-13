import { FastifyInstance } from 'fastify';
import {
  createPaymentHandler,
  getPaymentByIdHandler,
  processPaymentHandler,
  verifyPaymentHandler,
  cancelPaymentHandler,
  getMyPaymentsHandler
} from '../controllers/payments.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Student Payment Creation & History
  fastify.post('/payments/create', { preHandler: [requireRole('USER')] }, createPaymentHandler);
  fastify.get('/payments/my', { preHandler: [requireRole('USER')] }, getMyPaymentsHandler);

  // Payment Execution & Verification
  fastify.get('/payments/:paymentId', getPaymentByIdHandler);
  fastify.post('/payments/:paymentId/process', processPaymentHandler);
  fastify.post('/payments/:paymentId/verify', verifyPaymentHandler);
  fastify.post('/payments/:paymentId/cancel', cancelPaymentHandler);
}