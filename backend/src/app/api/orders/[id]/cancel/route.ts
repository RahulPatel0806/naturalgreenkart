import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { orderService } from '@/modules/order/order.service';
import { RoleName } from '@prisma/client';

/** POST /api/orders/:id/cancel — customer cancels their own (still-cancellable) order. */
export const POST = withHandler<{ id: string }>(
  async (_req, ctx) => {
    const order = await orderService.cancelByCustomer(ctx.auth.id, ctx.params.id, {
      actorId: ctx.auth.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return ok(order);
  },
  { auth: true, roles: [RoleName.CUSTOMER] },
);
