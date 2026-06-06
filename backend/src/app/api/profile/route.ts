import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateProfileSchema } from '@/validation/profile.schema';
import { userService } from '@/modules/user/user.service';

export const GET = withHandler(async (_req, ctx) => ok(await userService.getProfile(ctx.auth.id)), { auth: true });

export const PUT = withHandler(async (req, ctx) => {
  const input = await parseBody(req, updateProfileSchema);
  return ok(await userService.updateProfile(ctx.auth.id, input));
}, { auth: true });
