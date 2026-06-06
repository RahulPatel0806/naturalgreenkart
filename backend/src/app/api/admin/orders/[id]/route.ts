import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { orderService } from '@/modules/order/order.service';
import { RoleName } from '@prisma/client';

export const GET = withHandler<{ id: string }>(
  async (_req, ctx) => ok(await orderService.getById(ctx.params.id)),
  { auth: true, roles: [RoleName.ADMIN] },
);
