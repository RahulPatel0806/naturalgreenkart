/** Data access for audit logs and app settings. */
import { prisma, type Prisma } from '@/core/db/prisma';
import { toSkipTake, type PageParams, type Paginated } from './pagination';
import type { AuditLog } from '@prisma/client';

export const auditRepository = {
  record(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  },

  recordInTx(tx: Prisma.TransactionClient, data: Prisma.AuditLogUncheckedCreateInput) {
    return tx.auditLog.create({ data });
  },

  async list(params: PageParams & { entity?: string; actorId?: string }): Promise<Paginated<AuditLog>> {
    const where: Prisma.AuditLogWhereInput = {
      ...(params.entity ? { entity: params.entity } : {}),
      ...(params.actorId ? { actorId: params.actorId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(params) }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },
};

export const settingRepository = {
  list() {
    return prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  },

  get(key: string) {
    return prisma.appSetting.findUnique({ where: { key } });
  },

  upsert(key: string, value: Prisma.InputJsonValue) {
    return prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  },
};
