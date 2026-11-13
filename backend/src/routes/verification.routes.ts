import { FastifyInstance } from 'fastify';
import {
  completeVerificationHandler,
  getSampleUniversityRecordsHandler,
  getVerificationHistoryHandler,
  getVerificationStatusHandler,
  startVerificationHandler,
  verifyCaptchaHandler,
  verifyOtpHandler
} from '../controllers/verification.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export async function verificationRoutes(fastify: FastifyInstance) {
  // Public sample records for documentation and demonstration
  fastify.get('/verification/sample-records', getSampleUniversityRecordsHandler);

  // Protected verification routes for student users (USER role required)
  fastify.register(async (studentApi) => {
    studentApi.addHook('preHandler', authenticate);
    studentApi.addHook('preHandler', requireRole('USER'));

    studentApi.post('/verification/start', startVerificationHandler);
    studentApi.post('/verification/captcha', verifyCaptchaHandler);
    studentApi.post('/verification/otp/verify', verifyOtpHandler);
    studentApi.post('/verification/complete', completeVerificationHandler);
    studentApi.get('/verification/status', getVerificationStatusHandler);
    studentApi.get('/verification/history', getVerificationHistoryHandler);
  });
}
