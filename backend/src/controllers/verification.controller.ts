import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { verificationService } from '../services/verification.service';
import { mockUniversityService } from '../services/mockUniversityService';

const startVerificationSchema = z.object({
  studentId: z.string().min(3, 'Student ID is required').max(30),
  institution: z.string().optional()
});

const verifyCaptchaSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  answer: z.string().min(1, 'CAPTCHA response is required')
});

const verifyOtpSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
});

export const startVerificationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = startVerificationSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0]?.message || 'Invalid verification request parameters'
      }
    });
  }

  const response = await verificationService.startVerification(request.user!, result.data.studentId);
  return reply.status(200).send({
    success: true,
    data: response
  });
};

export const verifyCaptchaHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = verifyCaptchaSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0]?.message || 'CAPTCHA answer is required'
      }
    });
  }

  const response = await verificationService.verifyCaptcha(
    request.user!.id,
    result.data.challengeId,
    result.data.answer
  );

  return reply.status(200).send({
    success: true,
    data: response
  });
};

export const verifyOtpHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = verifyOtpSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0]?.message || '6-digit OTP code is required'
      }
    });
  }

  const response = await verificationService.verifyOtp(
    request.user!.id,
    result.data.challengeId,
    result.data.otp
  );

  return reply.status(200).send({
    success: true,
    data: response
  });
};

export const completeVerificationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const response = await verificationService.completeVerification(request.user!.id);

  return reply.status(200).send({
    success: true,
    data: response
  });
};

export const getVerificationStatusHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const status = await verificationService.getVerificationStatus(request.user!.id);

  return reply.status(200).send({
    success: true,
    data: status
  });
};

export const getVerificationHistoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const history = await verificationService.getVerificationHistory(request.user!.id);

  return reply.status(200).send({
    success: true,
    data: history
  });
};

export const getSampleUniversityRecordsHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const sampleRecords = mockUniversityService.getSampleStudentRecords();

  return reply.status(200).send({
    success: true,
    data: sampleRecords,
    meta: {
      isSimulated: true,
      notice: 'Deterministic hackathon simulation records for test evaluation only.'
    }
  });
};
