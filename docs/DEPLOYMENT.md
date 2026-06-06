# Production Deployment Guide (Azure)

Target: **Azure Web App for Containers** (backend) + **Azure PostgreSQL Flexible Server** +
**Azure Blob Storage**, image hosted in **Azure Container Registry**, CI/CD via GitHub Actions.

## 0. Prerequisites

- Azure CLI (`az`), Docker, an Azure subscription.
- Strong secrets: `openssl rand -base64 48` for each JWT secret.

## 1. Provision infrastructure (Bicep)

```bash
az login
az group create -n aggrimart-rg -l centralindia

az deployment group create \
  -g aggrimart-rg \
  -f infra/azure/main.bicep \
  -p pgAdminPassword='<STRONG_DB_PWD>' \
     jwtAccessSecret='<ACCESS_SECRET>' \
     jwtRefreshSecret='<REFRESH_SECRET>'
```

Outputs include `webAppUrl`, `postgresFqdn`, `acrLoginServer`, `blobBaseUrl`.
This creates: Log Analytics, PostgreSQL Flexible Server (+ `aggrimart` DB + firewall rule for
Azure services), Storage Account with a public `product-images` container, ACR, a Linux B1
App Service Plan, and the Web App (Docker, `WEBSITES_PORT=4000`, health path `/api/health`,
all app settings wired including `DATABASE_URL`, JWT secrets, and Azure storage connection).

## 2. First image push

```bash
az acr login --name aggrimartacr
docker build -t aggrimartacr.azurecr.io/aggrimart-backend:latest ./backend
docker push aggrimartacr.azurecr.io/aggrimart-backend:latest
```

## 3. Migrate & seed the database

Run migrations from your machine (or a one-off job) against the Azure DB:

```bash
cd backend
export DATABASE_URL="postgresql://aggriadmin:<DB_PWD>@<postgresFqdn>:5432/aggrimart?sslmode=require"
npx prisma migrate deploy
npm run db:seed         # optional: seed roles/admin/catalog (idempotent)
```

> Roles **must** exist before login works (the customer role is required for auto-registration).
> The seed creates them; alternatively run a minimal roles-only seed.

## 4. Restart / verify

```bash
az webapp restart -g aggrimart-rg -n aggrimart-api
curl https://aggrimart-api.azurewebsites.net/api/health   # → { success:true, data:{ status:"healthy" } }
```

## 5. CI/CD (GitHub Actions)

Two workflows in `.github/workflows`:

- **backend-ci.yml** — on PR/push: install, prisma generate, typecheck, lint, migrate (against a
  Postgres service container), build.
- **backend-deploy.yml** — on push to `main`: build & push image to ACR, run
  `prisma migrate deploy` against prod, deploy the new image to the Web App.

Configure repo **secrets**:

| Secret | Purpose |
|--------|---------|
| `AZURE_CREDENTIALS` | Service principal JSON for `azure/login` |
| `DATABASE_URL` | Prod connection string (for migrate step) |

Create the service principal:

```bash
az ad sp create-for-rbac --name aggrimart-deploy \
  --role contributor \
  --scopes /subscriptions/<SUB_ID>/resourceGroups/aggrimart-rg \
  --sdk-auth
```

## 6. Production hardening checklist

- [ ] Set `OTP_DEV_MODE=false` (never return OTP codes in prod) and wire a real SMS provider
      in `core/storage/sms.ts` (`SMS_PROVIDER`, `SMS_API_KEY`).
- [ ] Replace the in-memory rate limiter with Azure Cache for Redis if running >1 instance
      (the `RateLimiter` interface is drop-in).
- [ ] Restrict `CORS_ALLOWED_ORIGINS` to known origins.
- [ ] Restrict PostgreSQL firewall to App Service outbound IPs / use VNet integration + Private Endpoint.
- [ ] Rotate JWT secrets; store secrets in **Azure Key Vault** referenced from App Settings.
- [ ] Enable PostgreSQL geo-redundant backups and (for scale) high availability.
- [ ] Point the mobile build's `EXPO_PUBLIC_API_BASE_URL` to the prod API and build via EAS.

## Mobile release

```bash
cd mobile
# set EXPO_PUBLIC_API_BASE_URL to https://aggrimart-api.azurewebsites.net/api
npx eas build --platform all     # requires an Expo account + eas.json
```

## Rollback

App Service keeps prior image tags. Redeploy a previous SHA:

```bash
az webapp config container set -g aggrimart-rg -n aggrimart-api \
  --container-image-name aggrimartacr.azurecr.io/aggrimart-backend:<PREVIOUS_SHA>
```
Roll DB back only with a tested down-migration or point-in-time restore.
