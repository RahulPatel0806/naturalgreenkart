import { withHandler } from '@/middleware/with-handler';
import { noContent } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { logoutSchema } from '@/validation/auth.schema';
import { authService } from '@/modules/auth/auth.service';

export const POST = withHandler(
  async (req, ctx) => {
    const body = await parseBody(req, logoutSchema);
    await authService.logout(ctx.auth.id, body.refreshToken, body.allDevices);
    return noContent();
  },
  { auth: true },
);
