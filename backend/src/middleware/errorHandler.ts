import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../utils/env';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const statusCode = error.statusCode || 500;
  const isProd = env.NODE_ENV === 'production';

  request.log.error(error);

  reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 && isProd ? 'An unexpected error occurred' : error.message,
      ...(isProd ? {} : { details: error.validation || error.stack })
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: request.url
    }
  });
};
