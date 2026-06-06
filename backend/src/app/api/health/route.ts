import { prisma } from '@/core/db/prisma';
import { ok, fail } from '@/core/http/api-response';

export const dynamic = 'force-dynamic';

/** Liveness + readiness probe (checks DB connectivity). Used by Azure App Service. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: 'healthy', db: 'up', timestamp: new Date().toISOString() });
  } catch {
    return fail('INTERNAL', 'Database unreachable', 503, { db: 'down' });
  }
}
