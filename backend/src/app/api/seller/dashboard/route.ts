import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { dashboardService } from '@/modules/dashboard/dashboard.service';
import { RoleName } from '@prisma/client';

export const GET = withHandler(async () => ok(await dashboardService.sellerDashboard()), {
  auth: true,
  roles: [RoleName.SELLER, RoleName.ADMIN],
});
