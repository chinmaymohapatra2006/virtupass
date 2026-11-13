import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { paymentService } from '../services/paymentService';
import { PaymentMethod } from '../types';
import { SimulatedOutcome } from '../services/mockPaymentProvider';

const createPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET']),
  idempotencyKey: z.string().min(1, 'Idempotency key is required')
});

const processPaymentSchema = z.object({
  outcome: z.enum(['SUCCESS', 'FAILED', 'CANCELLED', 'PENDING']).default('SUCCESS'),
  method: z.enum(['UPI', 'CARD', 'NET_BANKING', 'WALLET']).optional()
});

const paymentParamsSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required')
});

export const createPaymentHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const parsed = createPaymentSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payment creation parameters',
        details: parsed.error.format()
      }
    });
  }

  try {
    const payment = await paymentService.createPayment(request.user.id, {
      bookingId: parsed.data.bookingId,
      paymentMethod: parsed.data.paymentMethod as PaymentMethod,
      idempotencyKey: parsed.data.idempotencyKey
    });

    return reply.status(201).send({
      success: true,
      data: payment,
      meta: {
        disclaimer: 'Demo Payment Mode — Simulated transaction. No real money will be transferred.'
      }
    });
  } catch (err: any) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'PAYMENT_CREATION_FAILED',
        message: err.message || 'Failed to initialize payment session'
      }
    });
  }
};

export const getPaymentByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const params = paymentParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid payment ID' }
    });
  }

  try {
    const payment = paymentService.getPaymentById(
      params.data.paymentId,
      request.user.id,
      request.user.role
    );
    return reply.send({
      success: true,
      data: payment
    });
  } catch (err: any) {
    const isNotFound = err.message.includes('not found');
    return reply.status(isNotFound ? 404 : 403).send({
      success: false,
      error: {
        code: isNotFound ? 'NOT_FOUND' : 'FORBIDDEN',
        message: err.message
      }
    });
  }
};

export const processPaymentHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const params = paymentParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid payment ID' }
    });
  }

  const body = processPaymentSchema.safeParse(request.body || {});
  const outcome = (body.success ? body.data.outcome : 'SUCCESS') as SimulatedOutcome;
  const method = body.success ? (body.data.method as PaymentMethod) : undefined;

  try {
    const result = await paymentService.processPayment(
      params.data.paymentId,
      request.user.id,
      outcome,
      method
    );

    return reply.send({
      success: true,
      data: result,
      meta: {
        isSimulated: true
      }
    });
  } catch (err: any) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'PAYMENT_PROCESSING_FAILED',
        message: err.message
      }
    });
  }
};

export const verifyPaymentHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const params = paymentParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid payment ID' }
    });
  }

  try {
    const result = await paymentService.verifyPayment(params.data.paymentId, request.user.id);
    return reply.send({
      success: true,
      data: result
    });
  } catch (err: any) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: err.message
      }
    });
  }
};

export const cancelPaymentHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const params = paymentParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid payment ID' }
    });
  }

  try {
    const payment = await paymentService.cancelPayment(params.data.paymentId, request.user.id);
    return reply.send({
      success: true,
      data: payment,
      message: 'Payment cancelled and ticket inventory hold released'
    });
  } catch (err: any) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'CANCELLATION_FAILED',
        message: err.message
      }
    });
  }
};

export const getMyPaymentsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const payments = paymentService.getUserPayments(request.user.id);
  return reply.send({
    success: true,
    data: payments,
    meta: { count: payments.length }
  });
};