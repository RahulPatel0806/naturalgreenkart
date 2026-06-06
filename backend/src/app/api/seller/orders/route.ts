import { withHandler } from '@/middleware/with-handler';
import { ok, buildPaginationMeta } from '@/core/http/api-response';
import { parseQuery } from '@/validation/common';
import { adminOrderListQuerySchema } from '@/validation/order.schema';
import { orderService } from '@/modules/order/order.service';
import { RoleName } from '@prisma/client';

/** GET /api/seller/orders — all store orders with optional status filter. */
export const GET = withHandler(async (req) => {
  const q = parseQuery(req.nextUrl, adminOrderListQuerySchema);
  const result = await orderService.listAll(q);
  return ok(result.items, { meta: { pagination: buildPaginationMeta(result.page, result.pageSize, result.total) } });
}, { auth: true, roles: [RoleName.SELLER, RoleName.ADMIN] });
