/**
 * Prisma client singleton.
 * In dev, Next.js hot-reload would otherwise create a new client on every
 * reload and exhaust DB connections — so we cache it on globalThis.
 */
import { PrismaClient } from '@prisma/client';
import { isProd } from '@/core/config/env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (!isProd) globalForPrisma.prisma = prisma;

export type { Prisma } from '@prisma/client';
