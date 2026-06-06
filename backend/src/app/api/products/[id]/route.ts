import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { catalogService } from '@/modules/catalog/catalog.service';

export const GET = withHandler<{ id: string }>(async (_req, ctx) => {
  const product = await catalogService.getProduct(ctx.params.id);
  return ok(product);
});
