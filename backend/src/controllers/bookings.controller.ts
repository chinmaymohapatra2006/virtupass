import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { bookingService } from '../services/bookingService';
import { BookingStatus } from '../types';

const quoteRequestSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  ticketCategoryId: z.string().min(1, 'Ticket Category ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(5, 'Maximum 5 tickets per booking')
});

const initiateBookingSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required')
});

const getBookingsQuerySchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED']).optional()
});

const getBookingParamsSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required')
});

export const createQuoteHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const parseResult = quoteRequestSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid quote request payload',
        details: parseResult.error.format()
      }
    });
  }

  try {
    const quote = bookingService.createQuote(request.user.id, parseResult.data);
    return reply.status(200).send({
      success: true,
      data: quote,
      meta: {
        validForSeconds: Math.floor((quote.expiresAt - Date.now()) / 1000)
      }
    });
  } catch (err: any) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'QUOTE_FAILED',
        message: err.message || 'Failed to generate quote'
      }
    });
  }
};

export const initiateBookingHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const parseResult = initiateBookingSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid booking initiation payload',
        details: parseResult.error.format()
      }
    });
  }

  try {
    const booking = bookingService.initiateBooking(request.user.id, parseResult.data.quoteId);
    return reply.status(201).send({
      success: true,
      data: booking,
      meta: {
        note: 'Pass reserved under 15-minute temporary hold in PENDING_PAYMENT status. Complete payment in Phase 4 to issue verified ticket.'
      }
    });
  } catch (err: any) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'BOOKING_FAILED',
        message: err.message || 'Failed to initiate booking'
      }
    });
  }
};

export const getMyBookingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const queryResult = getBookingsQuerySchema.safeParse(request.query);
  const status = queryResult.success ? queryResult.data.status as BookingStatus : undefined;

  const bookings = bookingService.getUserBookings(request.user.id, status);
  return reply.status(200).send({
    success: true,
    data: bookings,
    meta: {
      count: bookings.length
    }
  });
};

export const getBookingByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const paramsResult = getBookingParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid booking ID parameter'
      }
    });
  }

  try {
    const booking = bookingService.getBookingById(
      paramsResult.data.bookingId,
      request.user.id,
      request.user.role
    );
    return reply.status(200).send({
      success: true,
      data: booking
    });
  } catch (err: any) {
    const isNotFound = err.message.includes('not found');
    const isUnauthorized = err.message.includes('Unauthorized');
    return reply.status(isNotFound ? 404 : isUnauthorized ? 403 : 400).send({
      success: false,
      error: {
        code: isNotFound ? 'NOT_FOUND' : isUnauthorized ? 'FORBIDDEN' : 'BAD_REQUEST',
        message: err.message
      }
    });
  }
};