import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { adminUserService } from '@/modules/user/admin-user.service';
import { RoleName } from '@prisma/client';

export const GET = withHandler<{ id: string }>(
  async (_req, ctx) => ok(await adminUserService.get(ctx.params.id)),
  { auth: true, roles: [RoleName.ADMIN] },
);
