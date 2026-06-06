/** Thin service over the audit repository so callers express intent, not storage. */
import { auditRepository } from '@/repositories/audit.repository';
import { logger } from '@/core/logger/logger';
import type { Prisma } from '@/core/db/prisma';

export interface AuditContext {
  actorId?: string | null;
  ip?: string;
  userAgent?: string;
}

export const auditService = {
  /** Records an audit entry; never throws into the caller's flow. */
  async log(
    action: string,
    entity: string,
    entityId: string | null,
    ctx: AuditContext,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await auditRepository.record({
        action,
        entity,
        entityId,
        actorId: ctx.actorId ?? null,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata,
      });
    } catch (err) {
      logger.error({ err, action, entity }, 'failed to write audit log');
    }
  },
};
