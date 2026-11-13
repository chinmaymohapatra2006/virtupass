import { FastifyInstance } from 'fastify';
import { getHealthHandler } from '../controllers/health.controller';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', getHealthHandler);
}
