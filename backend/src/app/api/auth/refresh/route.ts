import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { refreshSchema } from '@/validation/auth.schema';
import { authService } from '@/modules/auth/auth.service';
import { env } from '@/core/config/env';

export const POST = withHandler(
  async (req, ctx) => {
    const { refreshToken } = await parseBody(req, refreshSchema);
    const tokens = await authService.refresh(refreshToken, { ip: ctx.ip, userAgent: ctx.userAgent });
    return ok(tokens);
  },
  { rateLimit: { max: env.RATE_LIMIT_AUTH_MAX, bucket: 'auth:refresh' } },
);
