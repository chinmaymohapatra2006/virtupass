import { inMemoryStore } from '../data/inMemoryStore';
import { AuditAction, AuditEntityType, AuditLog, UserRole } from '../types';

export interface CreateAuditEntryInput {
  actorId: string;
  actorEmail?: string;
  actorRole: UserRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Records an immutable audit log entry in backend memory.
   * Sanitizes all metadata to prevent logging sensitive secrets or PII.
   */
  public logAction(input: CreateAuditEntryInput): AuditLog {
    const sanitizedMetadata = this.sanitizeMetadata(input.metadata);

    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      timestamp: new Date().toISOString(),
      metadata: sanitizedMetadata
    };

    return inMemoryStore.addAuditLog(log);
  }

  /**
   * Retrieves audit logs with optional filtering.
   */
  public getLogs(
    filter?: { action?: string; entityType?: string; actorId?: string },
    limit: number = 100
  ): AuditLog[] {
    return inMemoryStore.getAuditLogs(filter, limit);
  }

  /**
   * Strips sensitive keys like passwords, secrets, and raw tokens.
   */
  private sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!meta) return undefined;
    const sanitized: Record<string, unknown> = {};

    const sensitiveKeys = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'signature', 'cvv'];

    for (const [key, value] of Object.entries(meta)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

export const auditService = new AuditService();
