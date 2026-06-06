import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { reorderSchema } from '@/validation/order.schema';
import { orderService } from '@/modules/order/order.service';
import { RoleName } from '@prisma/client';

/** POST /api/orders/reorder — re-add a past order's items to the cart. */
export const POST = withHandler(
  async (req, ctx) => {
    const { orderId } = await parseBody(req, reorderSchema);
    return ok(await orderService.reorder(ctx.auth.id, orderId));
  },
  { auth: true, roles: [RoleName.CUSTOMER] },
);
