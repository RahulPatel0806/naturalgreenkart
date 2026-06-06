import { withHandler } from '@/middleware/with-handler';
import { ok, created, buildPaginationMeta } from '@/core/http/api-response';
import { parseBody, parseQuery } from '@/validation/common';
import { productListQuerySchema, createProductSchema } from '@/validation/catalog.schema';
import { catalogService } from '@/modules/catalog/catalog.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const sellerOrAdmin = { auth: true as const, roles: [RoleName.SELLER, RoleName.ADMIN] };

/** GET /api/seller/products — full catalog incl. inactive, for management. */
export const GET = withHandler(async (req) => {
  const q = parseQuery(req.nextUrl, productListQuerySchema);
  const result = await catalogService.listProducts({ ...q, activeOnly: false });
  return ok(result.items, { meta: { pagination: buildPaginationMeta(result.page, result.pageSize, result.total) } });
}, sellerOrAdmin);

/** POST /api/seller/products — create a product (with inventory + images). */
export const POST = withHandler(async (req, ctx) => {
  const input = await parseBody(req, createProductSchema);
  const product = await catalogService.createProduct(ctx.auth.id, input);
  await auditService.log('PRODUCT_CREATED', 'Product', product.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return created(product);
}, sellerOrAdmin);
