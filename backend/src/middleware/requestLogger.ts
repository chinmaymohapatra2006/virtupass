import { FastifyReply, FastifyRequest } from 'fastify';

export const requestLogger = async (request: FastifyRequest, reply: FastifyReply) => {
  const start = Date.now();
  reply.raw.on('finish', () => {
    const duration = Date.now() - start;
    if (request.url !== '/api/v1/health') {
      console.log(`[REQ] ${request.method} ${request.url} -> ${reply.statusCode} (${duration}ms)`);
    }
  });
};
