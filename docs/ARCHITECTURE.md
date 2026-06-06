# Architecture

Aggrimart follows **Clean Architecture** with strict layer boundaries and the
**Repository + Service** patterns. The guiding rule: *dependencies point inward, and
only repositories know about Prisma*.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Route Handler  (src/app/api/**/route.ts)                    │  HTTP only
│   • parse/validate input (Zod)                              │
│   • call a service                                          │
│   • return ok()/created()/noContent()                       │
└───────────────┬─────────────────────────────────────────────┘
                │  wrapped by withHandler():
                │  auth · RBAC · rate-limit · request log · error→envelope
┌───────────────▼─────────────────────────────────────────────┐
│ Service Layer  (src/modules/<domain>/*.service.ts)          │  business rules
│   • orchestration, transactions, pricing                    │
│   • emits notifications + audit logs                        │
│   • throws typed AppError subclasses                        │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│ Repository Layer  (src/repositories/*.repository.ts)        │  data access
│   • the ONLY code that imports Prisma                       │
│   • returns Prisma entities                                 │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│ PostgreSQL (via Prisma Client singleton)                    │
└─────────────────────────────────────────────────────────────┘
```

Presenters (`*.presenter.ts`) map Prisma entities → API DTOs, serialising `Decimal`
money to numbers so the wire format is stable and float-safe.

## Cross-cutting core (`src/core`)

| Module      | Responsibility |
|-------------|----------------|
| `config`    | Zod-validated, fail-fast environment loading |
| `db`        | Prisma client singleton (HMR-safe) |
| `errors`    | Typed error hierarchy (`AppError` + subclasses) |
| `http`      | Response envelope, pagination meta, request context |
| `security`  | JWT (jose), OTP, bcrypt hashing, in-memory rate limiter |
| `storage`   | Azure Blob adapter, SMS sender (Strategy) |
| `logger`    | pino structured logging with secret redaction |
| `utils`     | order-number/slug generators, money helpers |

## Request lifecycle

1. **Edge middleware** (`src/middleware.ts`) handles CORS + preflight and injects `x-request-id`.
2. **`withHandler`** wraps every route: rate-limit → authenticate → authorize(roles) →
   resolve params → run handler → attach headers/log. Any thrown error is translated to a
   uniform `{ success:false, error:{ code, message, details? } }` envelope with the right status.
3. **Service** performs the use case. Multi-step writes (place order, status change) run in a
   Prisma `$transaction` so inventory, order, cart, notification and audit changes are atomic.
4. **Repository** executes the queries.

## Domain highlights

- **Auth** — phone+OTP. OTPs and refresh tokens are stored *hashed*; refresh tokens rotate on
  use and can be revoked (logout / block). New numbers auto-register as customers.
- **Orders** — an explicit **status state machine** (`order.status.ts`) is the single source of
  truth for legal transitions and who may perform them. Rejection/cancellation restocks inventory.
  Orders snapshot the shipping address and product details so they stay immutable.
- **Pricing** — delivery fee, free-delivery threshold and minimum order value come from
  `AppSetting`, resolved once in the settings service and applied consistently in cart + checkout.
- **RBAC** — `Role` table + `RoleName` enum. Seller routes allow SELLER+ADMIN; admin routes ADMIN only.

## Mobile architecture

```
App.tsx → providers (QueryClient, SafeArea, GestureHandler)
  RootNavigator → reads auth status+role → Customer | Seller | Admin navigator
    Screens → feature hooks (useCart, react-query) → api/endpoints → axios client
```

- **Axios client** attaches the bearer token, refreshes once on 401 (single-flight, queues
  concurrent calls), and unwraps the API envelope.
- **Auth store** (Zustand) persists tokens in `expo-secure-store` and exposes
  `bootstrap / setSession / logout`.
- **TanStack Query** owns server state with centralised query keys for predictable invalidation.
- **NativeWind** provides the Instamart-inspired green design system from `tailwind.config.js`.
