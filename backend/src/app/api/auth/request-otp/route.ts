import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { requestOtpSchema } from '@/validation/auth.schema';
import { authService } from '@/modules/auth/auth.service';
import { env } from '@/core/config/env';

export const POST = withHandler(
  async (req) => {
    const { phone } = await parseBody(req, requestOtpSchema);
    const result = await authService.requestOtp(phone);
    return ok({
      message: 'OTP sent successfully',
      resendIn: result.resendIn,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  },
  { rateLimit: { max: env.RATE_LIMIT_AUTH_MAX, bucket: 'auth:request-otp' } },
);
