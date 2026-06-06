import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { userService } from '@/modules/user/user.service';

/** POST /api/addresses/:id/default — make this the default delivery address. */
export const POST = withHandler<{ id: string }>(
  async (_req, ctx) => ok(await userService.setDefaultAddress(ctx.auth.id, ctx.params.id)),
  { auth: true },
);
