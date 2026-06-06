import { withHandler } from '@/middleware/with-handler';
import { ok, created, buildPaginationMeta } from '@/core/http/api-response';
import { parseBody, parseQuery } from '@/validation/common';
import { placeOrderSchema, orderListQuerySchema } from '@/validation/order.schema';
import { orderService } from '@/modules/order/order.service';
import { RoleName } from '@prisma/client';

const customerOnly = { auth: true as const, roles: [RoleName.CUSTOMER] };

/** GET /api/orders — the customer's own order history. */
export const GET = withHandler(async (req, ctx) => {
  const q = parseQuery(req.nextUrl, orderListQuerySchema);
  const result = await orderService.listForCustomer(ctx.auth.id, q);
  return ok(result.items, { meta: { pagination: buildPaginationMeta(result.page, result.pageSize, result.total) } });
}, customerOnly);

/** POST /api/orders — place a COD order from the current cart. */
export const POST = withHandler(async (req, ctx) => {
  const input = await parseBody(req, placeOrderSchema);
  const order = await orderService.placeOrder(ctx.auth.id, input, {
    actorId: ctx.auth.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return created(order);
}, customerOnly);
