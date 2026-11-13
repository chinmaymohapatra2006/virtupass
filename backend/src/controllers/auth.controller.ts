import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const studentRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  studentId: z.string().min(3, 'Student ID must be at least 3 characters').max(30),
  collegeName: z.string().min(2, 'College name is required'),
  department: z.string().min(2, 'Department is required'),
  yearOfStudy: z.coerce.number().min(1).max(6)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const organizerRegisterSchema = z.object({
  fullName: z.string().min(2, 'Organizer name must be at least 2 characters').max(80),
  organizationName: z.string().min(2, 'Organization or club name is required').max(100),
  email: z.string().email('Invalid email address format'),
  contactNumber: z.string().min(8, 'Valid contact number is required').max(20),
  collegeName: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const registerStudentHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = studentRegisterSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0]?.message || 'Invalid registration data',
        details: result.error.format()
      }
    });
  }

  const registered = await authService.registerStudent(result.data);
  return reply.status(201).send({
    success: true,
    data: registered
  });
};

export const registerOrganizerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = organizerRegisterSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0]?.message || 'Invalid organizer registration data',
        details: result.error.format()
      }
    });
  }

  const registered = await authService.registerOrganizer(result.data);
  return reply.status(201).send({
    success: true,
    data: registered
  });
};

export const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = loginSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0]?.message || 'Invalid login credentials format'
      }
    });
  }

  const session = await authService.login(result.data.email, result.data.password);
  return reply.status(200).send({
    success: true,
    data: session
  });
};

export const refreshTokenHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = refreshSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required'
      }
    });
  }

  const tokens = await authService.refreshTokens(result.data.refreshToken);
  return reply.status(200).send({
    success: true,
    data: tokens
  });
};

export const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as { refreshToken?: string } | undefined;
  await authService.logout(body?.refreshToken, request.user?.id);

  return reply.status(200).send({
    success: true,
    data: { message: 'Logged out successfully' }
  });
};

export const getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(200).send({
    success: true,
    data: request.user
  });
};
