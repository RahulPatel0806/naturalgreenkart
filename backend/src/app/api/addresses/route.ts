import { withHandler } from '@/middleware/with-handler';
import { ok, created } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { createAddressSchema } from '@/validation/profile.schema';
import { userService } from '@/modules/user/user.service';

export const GET = withHandler(async (_req, ctx) => ok(await userService.listAddresses(ctx.auth.id)), { auth: true });

export const POST = withHandler(async (req, ctx) => {
  const input = await parseBody(req, createAddressSchema);
  return created(await userService.createAddress(ctx.auth.id, input));
}, { auth: true });
