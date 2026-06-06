import { withHandler } from '@/middleware/with-handler';
import { ok, created, buildPaginationMeta } from '@/core/http/api-response';
import { parseBody, parseQuery } from '@/validation/common';
import { productListQuerySchema, createProductSchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const adminOnly = { auth: true as const, roles: [RoleName.ADMIN] };

export const GET = withHandler(async (req) => {
  const q = parseQuery(req.nextUrl, productListQuerySchema);
  const result = await catalogService.listProducts({ ...q, activeOnly: false });
  return ok(result.items, { meta: { pagination: buildPaginationMeta(result.page, result.pageSize, result.total) } });
}, adminOnly);

export const POST = withHandler(async (req, ctx) => {
  const input = await parseBody(req, createProductSchema);
  // In a single-store model the admin owns catalog; products are attributed to the admin account.
  const product = await catalogService.createProduct(ctx.auth.id, input);
  await auditService.log('PRODUCT_CREATED', 'Product', product.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return created(product);
}, adminOnly);
