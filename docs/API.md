# API Reference

Base URL: `http://localhost:4000/api` (dev) · all responses use a uniform envelope.

**Success**
```json
{ "success": true, "data": <payload>, "meta": { "pagination": { "page":1,"pageSize":20,"total":42,"totalPages":3 } } }
```
**Error**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": { } } }
```

Auth: send `Authorization: Bearer <accessToken>` on protected routes.
Error codes: `BAD_REQUEST · VALIDATION_ERROR · UNAUTHORIZED · FORBIDDEN · NOT_FOUND · CONFLICT · RATE_LIMITED · INTERNAL`.

---

## Auth

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/auth/request-otp` | – | `{ phone }` → `{ message, resendIn, devCode? }` |
| POST | `/auth/verify-otp` | – | `{ phone, code, name? }` → `{ accessToken, refreshToken, expiresIn, user }` |
| POST | `/auth/refresh` | – | `{ refreshToken }` → `{ accessToken, refreshToken, expiresIn }` |
| POST | `/auth/logout` | ✓ | `{ refreshToken?, allDevices? }` |
| GET  | `/auth/me` | ✓ | → current user profile |

## Catalog (public)

| Method | Path | Query |
|--------|------|-------|
| GET | `/products` | `page, pageSize, categoryId, search, sort=newest\|price_asc\|price_desc` |
| GET | `/products/:id` | – |
| GET | `/categories` | `activeOnly` |
| GET | `/config` | – (store config: delivery fee, minimums, COD) |

## Cart (customer)

| Method | Path | Body |
|--------|------|------|
| GET | `/cart` | – |
| POST | `/cart` | `{ productId, quantity }` (set) |
| PUT | `/cart` | `{ productId, quantity }` (0 removes) |
| DELETE | `/cart?productId=…` | omit productId to clear |

Returns the full `CartSummary` (items, subtotal, savings, deliveryFee, total, meetsMinimum).

## Orders (customer)

| Method | Path | Body |
|--------|------|------|
| GET | `/orders` | `?page` — own history |
| POST | `/orders` | `{ addressId, paymentMethod="COD", notes? }` |
| GET | `/orders/:id` | – |
| POST | `/orders/:id/cancel` | – (only PENDING/ACCEPTED) |
| POST | `/orders/reorder` | `{ orderId }` → `{ cart, skipped[] }` |

## Profile · Addresses · Notifications (authenticated)

`GET/PUT /profile` · `GET/POST /addresses` · `PUT/DELETE /addresses/:id` ·
`POST /addresses/:id/default` · `GET /notifications` · `POST /notifications/:id/read` ·
`POST /notifications/read-all`.

## Seller (SELLER, ADMIN)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/seller/dashboard` | totals, pending, delivered, revenue, low-stock |
| GET / POST | `/seller/products` | list (incl. inactive) / create |
| GET / PUT / DELETE | `/seller/products/:id` | manage |
| PATCH | `/seller/inventory/:id` | `{ stock?, isOutOfStock?, lowStockThreshold? }` |
| GET | `/seller/orders` | `?status, page, search` |
| PATCH | `/seller/orders/:id/status` | `{ status, reason? }` — state machine enforced |

**Order status flow:** `PENDING → ACCEPTED → PACKED → OUT_FOR_DELIVERY → DELIVERED`
(plus `REJECTED` from PENDING, `CANCELLED` from PENDING/ACCEPTED/PACKED). Reject/cancel restocks.

## Admin (ADMIN)

| Method | Path |
|--------|------|
| GET | `/admin/dashboard` |
| GET | `/admin/users` `?role,search,isBlocked,page` |
| GET | `/admin/users/:id` |
| PATCH | `/admin/users/:id/block` `{ isBlocked }` |
| GET/POST | `/admin/categories` |
| PUT/DELETE | `/admin/categories/:id` |
| GET/POST | `/admin/products` |
| GET/PUT/DELETE | `/admin/products/:id` |
| GET | `/admin/orders` `?status,search,page` |
| GET | `/admin/orders/:id` |
| PATCH | `/admin/orders/:id/status` `{ status, reason? }` |
| GET/PUT | `/admin/settings` (`PUT { key, value }`) |

## Uploads (SELLER, ADMIN)

`POST /uploads { ext, prefix }` → `{ uploadUrl, blobName, publicUrl }`.
Client `PUT`s the image bytes to `uploadUrl` (Azure SAS), then sends `publicUrl` when
creating/updating a product.

## Health

`GET /health` → `{ status, db }` (checks DB connectivity; used by Azure health probe).
