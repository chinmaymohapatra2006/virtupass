import { FastifyInstance } from 'fastify';
import { getEventHandler, listEventsHandler } from '../controllers/events.controller';

export async function eventsRoutes(fastify: FastifyInstance) {
  fastify.get('/events', listEventsHandler);
  fastify.get('/events/:id', getEventHandler);
}
