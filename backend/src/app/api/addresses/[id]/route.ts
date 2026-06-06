import { withHandler } from '@/middleware/with-handler';
import { ok, noContent } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateAddressSchema } from '@/validation/profile.schema';
import { userService } from '@/modules/user/user.service';

export const PUT = withHandler<{ id: string }>(async (req, ctx) => {
  const input = await parseBody(req, updateAddressSchema);
  return ok(await userService.updateAddress(ctx.auth.id, ctx.params.id, input));
}, { auth: true });

export const DELETE = withHandler<{ id: string }>(async (_req, ctx) => {
  await userService.deleteAddress(ctx.auth.id, ctx.params.id);
  return noContent();
}, { auth: true });
