import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseQuery } from '@/validation/common';
import { categoryQuerySchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';

export const GET = withHandler(async (req) => {
  const { activeOnly } = parseQuery(req.nextUrl, categoryQuerySchema);
  const categories = await catalogService.listCategories(activeOnly);
  return ok(categories);
});
