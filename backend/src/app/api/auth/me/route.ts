import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { userService } from '@/modules/user/user.service';

/** Returns the authenticated user's profile (identity + role). */
export const GET = withHandler(
  async (_req, ctx) => {
    const profile = await userService.getProfile(ctx.auth.id);
    return ok(profile);
  },
  { auth: true },
);
