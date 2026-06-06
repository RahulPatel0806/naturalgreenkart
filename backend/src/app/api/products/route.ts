import { withHandler } from '@/middleware/with-handler';
import { ok, buildPaginationMeta } from '@/core/http/api-response';
import { parseQuery } from '@/validation/common';
import { productListQuerySchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';

/** Public product catalog with pagination, search, category filter and sorting. */
export const GET = withHandler(async (req) => {
  const q = parseQuery(req.nextUrl, productListQuerySchema);
  const result = await catalogService.listProducts({ ...q, activeOnly: true });
  return ok(result.items, {
    meta: { pagination: buildPaginationMeta(result.page, result.pageSize, result.total) },
  });
});
