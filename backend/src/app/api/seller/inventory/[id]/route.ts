import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateInventorySchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

/** PATCH /api/seller/inventory/:id — update stock / out-of-stock flag for a product. */
export const PATCH = withHandler<{ id: string }>(async (req, ctx) => {
  const input = await parseBody(req, updateInventorySchema);
  const product = await catalogService.updateInventory(ctx.params.id, input);
  await auditService.log('INVENTORY_UPDATED', 'Product', ctx.params.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent }, input);
  return ok(product);
}, { auth: true, roles: [RoleName.SELLER, RoleName.ADMIN] });
