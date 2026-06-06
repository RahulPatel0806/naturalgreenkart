import { withHandler } from '@/middleware/with-handler';
import { noContent } from '@/core/http/api-response';
import { notificationService } from '@/modules/notification/notification.service';

export const POST = withHandler<{ id: string }>(async (_req, ctx) => {
  await notificationService.markRead(ctx.auth.id, ctx.params.id);
  return noContent();
}, { auth: true });
