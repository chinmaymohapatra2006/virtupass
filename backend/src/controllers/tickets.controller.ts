import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ticketService } from '../services/ticketService';

const ticketParamsSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required')
});

export const getMyTicketsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const tickets = ticketService.getTicketsByUserId(request.user.id);
  return reply.send({
    success: true,
    data: tickets,
    meta: {
      count: tickets.length
    }
  });
};

export const getTicketByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const params = ticketParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid ticket ID' }
    });
  }

  try {
    const ticket = ticketService.getTicketById(
      params.data.ticketId,
      request.user.id,
      request.user.role
    );
    return reply.send({
      success: true,
      data: ticket
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

export const getTicketQrHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const params = ticketParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid ticket ID' }
    });
  }

  try {
    const ticket = ticketService.getTicketById(
      params.data.ticketId,
      request.user.id,
      request.user.role
    );

    return reply.send({
      success: true,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        qrPayload: ticket.qrPayload,
        qrCodeDataUrl: ticket.qrCodeDataUrl,
        status: ticket.status
      }
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

export const downloadTicketHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const params = ticketParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid ticket ID' }
    });
  }

  try {
    const downloadData = ticketService.getTicketDownloadData(
      params.data.ticketId,
      request.user.id,
      request.user.role
    );

    return reply.send({
      success: true,
      data: downloadData
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