import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { inMemoryStore } from '../data/inMemoryStore';
import { env } from '../utils/env';
import { SafeUser, TokenPayload, UserRole } from '../types';

// Augment FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: SafeUser;
  }
}

/**
 * Authentication hook to verify JWT access tokens
 */
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED_MISSING_TOKEN',
        message: 'Authentication token is required to access this resource'
      }
    });
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    if (decoded.type !== 'access') {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'An access token is required'
        }
      });
    }

    const user = inMemoryStore.findUserById(decoded.userId);

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with this token no longer exists'
        }
      });
    }

    if (user.status === 'SUSPENDED') {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'This account has been suspended by administration'
        }
      });
    }

    // Attach safe user to request
    request.user = inMemoryStore.toSafeUser(user);
  } catch (err: any) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: err.name === 'TokenExpiredError' ? 'Authentication token has expired' : 'Invalid authentication token'
      }
    });
  }
};

/**
 * Authorization hook enforcing role-based access control
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication is required before checking role permissions'
        }
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN_INSUFFICIENT_ROLE',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}] but user has role: '${request.user.role}'`
        }
      });
    }
  };
};

/**
 * Authorization hook ensuring organizer is approved before managing events
 */
export const requireApprovedOrganizer = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required'
      }
    });
  }

  if (request.user.role !== 'ORGANIZER') {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN_NOT_ORGANIZER',
        message: 'Only registered organizers can access this resource'
      }
    });
  }

  if (request.user.approvalStatus !== 'APPROVED') {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'ORGANIZER_PENDING_APPROVAL',
        message: 'Organizer account is pending approval by platform administration'
      }
    });
  }
};
