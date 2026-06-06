import { withHandler } from '@/middleware/with-handler';
import { ok, noContent } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateCategorySchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const adminOnly = { auth: true as const, roles: [RoleName.ADMIN] };

export const PUT = withHandler<{ id: string }>(async (req, ctx) => {
  const input = await parseBody(req, updateCategorySchema);
  const category = await catalogService.updateCategory(ctx.params.id, input);
  await auditService.log('CATEGORY_UPDATED', 'Category', ctx.params.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return ok(category);
}, adminOnly);

export const DELETE = withHandler<{ id: string }>(async (_req, ctx) => {
  await catalogService.deleteCategory(ctx.params.id);
  await auditService.log('CATEGORY_DELETED', 'Category', ctx.params.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return noContent();
}, adminOnly);
