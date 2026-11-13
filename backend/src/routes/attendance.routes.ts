import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireRole, requireApprovedOrganizer } from '../middleware/auth.middleware';
import { attendanceService } from '../services/attendanceService';
import { ScanResult } from '../types';

const scanSchema = z.object({
  tokenOrPayload: z.string().min(1, 'QR payload or token required'),
  eventId: z.string().min(1, 'Target event ID required'),
  gateName: z.string().optional(),
  deviceInfo: z.string().optional()
});

export async function attendanceRoutes(fastify: FastifyInstance) {
  // Requires authentication
  fastify.addHook('preHandler', authenticate);

  // 1. Scan & Validate Ticket at Entry Gate
  fastify.post('/attendance/scan', async (request, reply) => {
    // Only approved organizers or admins can scan
    if (request.user?.role !== 'ADMIN' && request.user?.role !== 'ORGANIZER') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Gate scanning is restricted to authorized personnel' }
      });
    }

    if (request.user.role === 'ORGANIZER' && request.user.approvalStatus !== 'APPROVED') {
      return reply.status(403).send({
        success: false,
        error: { code: 'ORGANIZER_NOT_APPROVED', message: 'Organizer account has not been approved' }
      });
    }

    const parsed = scanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid scan payload',
          details: parsed.error.format()
        }
      });
    }

    try {
      const result = await attendanceService.validateAndRecordScan({
        organizerId: request.user.id,
        userRole: request.user.role,
        eventId: parsed.data.eventId,
        tokenOrPayload: parsed.data.tokenOrPayload,
        gateName: parsed.data.gateName,
        deviceInfo: parsed.data.deviceInfo
      });

      if (!result.success) {
        if (result.scanResult === 'DUPLICATE') {
          return reply.status(409).send({
            success: false,
            scanResult: result.scanResult,
            error: {
              code: 'DUPLICATE_ENTRY',
              message: result.message
            },
            data: result
          });
        }
        if (result.scanResult === 'WRONG_EVENT') {
          return reply.status(400).send({
            success: false,
            scanResult: result.scanResult,
            error: {
              code: 'WRONG_EVENT',
              message: result.message
            },
            data: result
          });
        }
        if (result.scanResult === 'REVOKED') {
          return reply.status(403).send({
            success: false,
            scanResult: result.scanResult,
            error: {
              code: 'TICKET_REVOKED',
              message: result.message
            },
            data: result
          });
        }
        return reply.status(400).send({
          success: false,
          scanResult: result.scanResult,
          error: {
            code: 'INVALID_TICKET',
            message: result.message
          },
          data: result
        });
      }

      return reply.send({
        success: true,
        scanResult: 'ADMITTED',
        data: result
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SCAN_FAILED',
          message: err.message
        }
      });
    }
  });

  // 2. Query Attendance Records (Scoped)
  fastify.get('/attendance', async (request, reply) => {
    const { eventId, search, scanResult } = request.query as {
      eventId?: string;
      search?: string;
      scanResult?: ScanResult;
    };

    const records = attendanceService.getAttendance({
      userId: request.user!.id,
      role: request.user!.role,
      eventId,
      search,
      scanResult
    });

    return reply.send({
      success: true,
      data: records,
      meta: { count: records.length }
    });
  });

  // 3. Attendance Summary Statistics
  fastify.get('/attendance/stats', async (request, reply) => {
    const { eventId } = request.query as { eventId?: string };

    const stats = attendanceService.getAttendanceStats({
      userId: request.user!.id,
      role: request.user!.role,
      eventId
    });

    return reply.send({
      success: true,
      data: stats
    });
  });

  // 4. Export Attendance Report (CSV)
  fastify.get('/attendance/export', async (request, reply) => {
    const { eventId } = request.query as { eventId?: string };

    const csvContent = attendanceService.generateAttendanceCsv({
      userId: request.user!.id,
      role: request.user!.role,
      eventId
    });

    reply.header('Content-Type', 'text/csv');
    reply.header(
      'Content-Disposition',
      `attachment; filename="virtupass-attendance-${Date.now()}.csv"`
    );
    return reply.send(csvContent);
  });
}
