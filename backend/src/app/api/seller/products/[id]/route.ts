import { withHandler } from '@/middleware/with-handler';
import { ok, noContent } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateProductSchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const sellerOrAdmin = { auth: true as const, roles: [RoleName.SELLER, RoleName.ADMIN] };

export const GET = withHandler<{ id: string }>(
  async (_req, ctx) => ok(await catalogService.getProduct(ctx.params.id)),
  sellerOrAdmin,
);

export const PUT = withHandler<{ id: string }>(async (req, ctx) => {
  const input = await parseBody(req, updateProductSchema);
  const product = await catalogService.updateProduct(ctx.params.id, input);
  await auditService.log('PRODUCT_UPDATED', 'Product', ctx.params.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return ok(product);
}, sellerOrAdmin);

export const DELETE = withHandler<{ id: string }>(async (_req, ctx) => {
  await catalogService.deleteProduct(ctx.params.id);
  await auditService.log('PRODUCT_DELETED', 'Product', ctx.params.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return noContent();
}, sellerOrAdmin);
