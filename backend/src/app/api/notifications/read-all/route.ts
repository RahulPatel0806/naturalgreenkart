import { withHandler } from '@/middleware/with-handler';
import { noContent } from '@/core/http/api-response';
import { notificationService } from '@/modules/notification/notification.service';

export const POST = withHandler(async (_req, ctx) => {
  await notificationService.markAllRead(ctx.auth.id);
  return noContent();
}, { auth: true });
