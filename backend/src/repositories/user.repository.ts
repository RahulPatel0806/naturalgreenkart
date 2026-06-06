/** Data access for users, roles, OTP codes and refresh tokens. */
import { prisma, type Prisma } from '@/core/db/prisma';
import type { RoleName } from '@prisma/client';
import { toSkipTake, type PageParams, type Paginated } from './pagination';

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { role: true } });
  },

  findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone }, include: { role: true } });
  },

  async getRoleId(name: RoleName): Promise<string> {
    const role = await prisma.role.findUniqueOrThrow({ where: { name } });
    return role.id;
  },

  create(data: { phone: string; roleId: string; name?: string }) {
    return prisma.user.create({ data, include: { role: true } });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, include: { role: true } });
  },

  setBlocked(id: string, isBlocked: boolean) {
    return prisma.user.update({ where: { id }, data: { isBlocked } });
  },

  async list(params: PageParams & { role?: RoleName; search?: string; isBlocked?: boolean }): Promise<Paginated<Prisma.UserGetPayload<{ include: { role: true } }>>> {
    const where: Prisma.UserWhereInput = {
      ...(params.role ? { role: { name: params.role } } : {}),
      ...(typeof params.isBlocked === 'boolean' ? { isBlocked: params.isBlocked } : {}),
      ...(params.search
        ? { OR: [{ name: { contains: params.search, mode: 'insensitive' } }, { phone: { contains: params.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, include: { role: true }, orderBy: { createdAt: 'desc' }, ...toSkipTake(params) }),
      prisma.user.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },
};

export const otpRepository = {
  create(data: { phone: string; codeHash: string; expiresAt: Date }) {
    return prisma.otpCode.create({ data });
  },

  latestActive(phone: string) {
    return prisma.otpCode.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  },

  latest(phone: string) {
    return prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
  },

  incrementAttempts(id: string) {
    return prisma.otpCode.update({ where: { id }, data: { attempts: { increment: 1 } } });
  },

  consume(id: string) {
    return prisma.otpCode.update({ where: { id }, data: { consumedAt: new Date() } });
  },
};

export const refreshTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date; ip?: string; userAgent?: string }) {
    return prisma.refreshToken.create({ data });
  },

  findValidByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  revoke(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
