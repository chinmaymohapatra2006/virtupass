import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { eventsService } from '../services/events.service';

const listEventsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  availableOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sortBy: z.enum(['date_asc', 'date_desc', 'price_asc', 'price_desc', 'featured']).optional()
});

const getEventParamsSchema = z.object({
  id: z.string().min(1)
});

export const listEventsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const query = listEventsQuerySchema.safeParse(request.query);
  const filterOptions = query.success ? query.data : {};
  const events = eventsService.getPublicEvents(filterOptions);

  return reply.status(200).send({
    success: true,
    data: events,
    meta: {
      count: events.length,
      filtersApplied: filterOptions,
      isDemoData: true
    }
  });
};

export const getEventHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const params = getEventParamsSchema.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid event ID parameter'
      }
    });
  }

  const event = eventsService.getEventById(params.data.id);
  if (!event) {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Event with id '${params.data.id}' was not found`
      }
    });
  }

  return reply.status(200).send({
    success: true,
    data: event,
    meta: {
      isDemoData: true
    }
  });
};