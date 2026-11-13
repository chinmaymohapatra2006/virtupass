import { FastifyInstance } from 'fastify';
import {
  getMeHandler,
  loginHandler,
  logoutHandler,
  refreshTokenHandler,
  registerOrganizerHandler,
  registerStudentHandler
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', registerStudentHandler);
  fastify.post('/auth/register/organizer', registerOrganizerHandler);
  fastify.post('/auth/login', loginHandler);
  fastify.post('/auth/refresh', refreshTokenHandler);

  // Authenticated endpoints
  fastify.post('/auth/logout', { preHandler: [authenticate] }, logoutHandler);
  fastify.get('/auth/me', { preHandler: [authenticate] }, getMeHandler);
}
