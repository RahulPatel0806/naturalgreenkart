import { withHandler } from '@/middleware/with-handler';
import { ok, created } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { createCategorySchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const adminOnly = { auth: true as const, roles: [RoleName.ADMIN] };

export const GET = withHandler(async () => ok(await catalogService.listCategories(false)), adminOnly);

export const POST = withHandler(async (req, ctx) => {
  const input = await parseBody(req, createCategorySchema);
  const category = await catalogService.createCategory(input);
  await auditService.log('CATEGORY_CREATED', 'Category', category.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return created(category);
}, adminOnly);
