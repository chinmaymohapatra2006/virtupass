import { FastifyReply, FastifyRequest } from 'fastify';
import { systemService } from '../services/system.service';
import { inMemoryStore } from '../data/inMemoryStore';

export const getSystemInfoHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
  const info = systemService.getSystemInfo();
  return reply.status(200).send({
    success: true,
    data: info
  });
};

export const getSystemStatsHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
  const stats = inMemoryStore.getSystemStats();
  return reply.status(200).send({
    success: true,
    data: stats
  });
};
