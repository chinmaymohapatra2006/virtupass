import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './utils/env';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { registerRoutes } from './routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Custom logger handles structured logging
    trustProxy: true
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production'
  });

  // CORS configuration for local development & Vercel deployments
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : [env.CORS_ORIGIN, /\.vercel\.app$/],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  });

  // Rate limiting (100 requests per minute per IP)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // Request logger hook
  app.addHook('onRequest', requestLogger);

  // Centralized error handler
  app.setErrorHandler(errorHandler);

  // Register API routes
  await registerRoutes(app);

  return app;
}
