# 🥦 Aggrimart — Grocery, Fruits & Vegetables Delivery Platform

A production-ready, single-store grocery delivery platform (Instamart-style) with a
**Next.js 15 + Prisma + PostgreSQL** backend and an **Expo / React Native** mobile app
serving three roles — **Customer**, **Seller**, and **Admin** — from a single, role-gated app.

> Status: backend and mobile both compile cleanly (`tsc --noEmit` ✅) and the backend
> produces a working Next.js standalone production build ✅.

---

## Monorepo layout

```
Aggrimart app/
├── backend/      Next.js 15 App Router API — Clean Architecture (repo → service → route)
├── mobile/       Expo React Native app (Customer + Seller + Admin, role-gated)
├── infra/        Docker, docker-compose, Azure Bicep
├── .github/      CI/CD workflows
└── docs/         Architecture & production deployment guide
```

## Architecture

Clean, layered, SOLID. **Only the repository layer touches the database.**

```
HTTP Route Handler  →  Zod validation  →  withHandler (auth · RBAC · rate-limit · error envelope)
        ↓
   Service layer (business rules, transactions, audit, notifications)
        ↓
  Repository layer (Prisma data access)
        ↓
     PostgreSQL
```

Key cross-cutting modules live in `backend/src/core`:
`config` (validated env), `errors` (typed hierarchy), `http` (response envelope),
`security` (JWT · OTP · hashing · rate-limit), `storage` (Azure Blob · SMS), `logger` (pino), `db` (Prisma singleton).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/API.md](docs/API.md).

---

## Tech stack

**Backend:** Next.js 15 (Route Handlers), TypeScript, Prisma ORM, PostgreSQL, JWT (jose),
bcryptjs, Zod, pino, Azure Blob Storage.
**Mobile:** Expo SDK 52, React Native 0.76, TypeScript, React Navigation, TanStack Query,
React Hook Form + Zod, NativeWind (Tailwind), Axios, Zustand, expo-secure-store.
**Infra:** Docker, Azure App Service (Web App for Containers), Azure PostgreSQL Flexible
Server, Azure Container Registry, GitHub Actions.

---

## Quick start (local)

### 1. Database

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d   # PostgreSQL on :5432
```

### 2. Backend

```bash
cd backend
cp .env.example .env            # adjust secrets if you like
npm install
npx prisma migrate dev --name init
npm run db:seed                 # demo users + catalog
npm run dev                     # API on http://localhost:4000
```

Seeded demo accounts (OTP is returned in the response in dev mode):

| Role     | Phone        |
|----------|--------------|
| Admin    | `9000000001` |
| Seller   | `9000000002` |
| Customer | `9000000003` |

### 3. Mobile

```bash
cd mobile
cp .env.example .env            # set EXPO_PUBLIC_API_BASE_URL to your machine IP for devices
npm install
npm start                       # Expo dev server
```

> On a physical device, set `EXPO_PUBLIC_API_BASE_URL=http://<your-LAN-ip>:4000/api`.

---

## Auth flow (phone + OTP)

1. `POST /api/auth/request-otp { phone }` → OTP issued (returned as `devCode` in dev).
2. `POST /api/auth/verify-otp { phone, code, name? }` → `{ accessToken, refreshToken, user }`.
   New numbers auto-register as **CUSTOMER**; seller/admin are provisioned via seed/admin.
3. Access token (15 min) is sent as `Authorization: Bearer`. On `401`, the mobile client
   transparently calls `POST /api/auth/refresh` (rotating refresh tokens) and replays the request.

## Security

JWT access/refresh with rotation & server-side revocation · RBAC guard on every protected
route · Zod input validation · per-IP rate limiting (stricter on auth) · secure headers
(`next.config.mjs`) · CORS (edge middleware) · audit logging of privileged actions ·
hashed OTPs & refresh tokens · fail-fast env validation · uniform error envelope that never
leaks internals.

---

## API surface (high level)

| Area      | Endpoints |
|-----------|-----------|
| Auth      | `POST /auth/request-otp`, `/auth/verify-otp`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Catalog   | `GET /products`, `/products/:id`, `/categories`, `/config` |
| Cart      | `GET/POST/PUT/DELETE /cart` |
| Orders    | `GET/POST /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`, `POST /orders/reorder` |
| Profile   | `GET/PUT /profile`, `GET/POST /addresses`, `PUT/DELETE /addresses/:id`, `POST /addresses/:id/default` |
| Notifs    | `GET /notifications`, `POST /notifications/:id/read`, `/notifications/read-all` |
| Seller    | `GET /seller/dashboard`, `GET/POST /seller/products`, `GET/PUT/DELETE /seller/products/:id`, `PATCH /seller/inventory/:id`, `GET /seller/orders`, `PATCH /seller/orders/:id/status` |
| Admin     | `GET /admin/dashboard`, users CRUD + block, categories CRUD, products CRUD, orders monitor + status, `GET/PUT /admin/settings` |
| Uploads   | `POST /uploads` → Azure Blob SAS |

Full reference: [docs/API.md](docs/API.md).

---

## Deployment

Container image → Azure Container Registry → Azure Web App for Containers, with Azure
PostgreSQL Flexible Server and Blob Storage. Infra is codified in
[infra/azure/main.bicep](infra/azure/main.bicep); CI/CD in [.github/workflows](.github/workflows).

Step-by-step: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Scripts

**Backend:** `npm run dev | build | start | typecheck | lint | prisma:migrate | prisma:deploy | db:seed`
**Mobile:** `npm start | android | ios | web | typecheck | lint`
