import { FastifyReply, FastifyRequest } from 'fastify';
import { systemService } from '../services/system.service';

export const getHealthHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
  const health = systemService.getHealth();
  return reply.status(200).send({
    success: true,
    data: health
  });
};
