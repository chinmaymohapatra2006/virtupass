import { FastifyInstance } from 'fastify';
import { getSystemInfoHandler, getSystemStatsHandler } from '../controllers/system.controller';

export async function systemRoutes(fastify: FastifyInstance) {
  fastify.get('/system/info', getSystemInfoHandler);
  fastify.get('/system/stats', getSystemStatsHandler);
}
