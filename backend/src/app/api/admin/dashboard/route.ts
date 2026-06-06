import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { dashboardService } from '@/modules/dashboard/dashboard.service';
import { RoleName } from '@prisma/client';

export const GET = withHandler(async () => ok(await dashboardService.adminDashboard()), {
  auth: true,
  roles: [RoleName.ADMIN],
});
