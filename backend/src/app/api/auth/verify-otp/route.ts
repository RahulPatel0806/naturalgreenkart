import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { verifyOtpSchema } from '@/validation/auth.schema';
import { authService } from '@/modules/auth/auth.service';
import { auditService } from '@/modules/audit/audit.service';
import { env } from '@/core/config/env';

export const POST = withHandler(
  async (req, ctx) => {
    const { phone, code, name } = await parseBody(req, verifyOtpSchema);
    const result = await authService.verifyOtp(phone, code, { ip: ctx.ip, userAgent: ctx.userAgent, name });
    await auditService.log('AUTH_LOGIN', 'User', result.user.id, { actorId: result.user.id, ip: ctx.ip, userAgent: ctx.userAgent });
    return ok(result);
  },
  { rateLimit: { max: env.RATE_LIMIT_AUTH_MAX, bucket: 'auth:verify-otp' } },
);
