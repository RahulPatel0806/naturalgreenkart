import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { addToCartSchema, updateCartItemSchema } from '@/validation/cart.schema';
import { cartService } from '@/modules/cart/cart.service';
import { RoleName } from '@prisma/client';

const customerOnly = { auth: true as const, roles: [RoleName.CUSTOMER] };

/** GET /api/cart — current cart with pricing summary. */
export const GET = withHandler(async (_req, ctx) => {
  return ok(await cartService.getSummary(ctx.auth.id));
}, customerOnly);

/** POST /api/cart — add an item (sets quantity). */
export const POST = withHandler(async (req, ctx) => {
  const { productId, quantity } = await parseBody(req, addToCartSchema);
  return ok(await cartService.addItem(ctx.auth.id, productId, quantity));
}, customerOnly);

/** PUT /api/cart — update item quantity (0 removes). */
export const PUT = withHandler(async (req, ctx) => {
  const { productId, quantity } = await parseBody(req, updateCartItemSchema);
  return ok(await cartService.updateItem(ctx.auth.id, productId, quantity));
}, customerOnly);

/** DELETE /api/cart?productId=... — remove one item, or clear the cart if omitted. */
export const DELETE = withHandler(async (req, ctx) => {
  const productId = req.nextUrl.searchParams.get('productId');
  const summary = productId
    ? await cartService.removeItem(ctx.auth.id, productId)
    : await cartService.clear(ctx.auth.id);
  return ok(summary);
}, customerOnly);
