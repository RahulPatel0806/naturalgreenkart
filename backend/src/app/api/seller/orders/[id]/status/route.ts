import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateOrderStatusSchema } from '@/validation/order.schema';
import { orderService } from '@/modules/order/order.service';
import { RoleName } from '@prisma/client';

/**
 * PATCH /api/seller/orders/:id/status
 * Transitions an order: ACCEPTED → PACKED → OUT_FOR_DELIVERY → DELIVERED
 * (or REJECTED / CANCELLED). Enforced by the order status state machine.
 */
export const PATCH = withHandler<{ id: string }>(async (req, ctx) => {
  const input = await parseBody(req, updateOrderStatusSchema);
  const order = await orderService.updateStatus(ctx.params.id, input, { id: ctx.auth.id, role: ctx.auth.role }, {
    actorId: ctx.auth.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return ok(order);
}, { auth: true, roles: [RoleName.SELLER, RoleName.ADMIN] });
