# Golf E-Commerce

Portfolio-ready monorepo for a modern golf storefront:

- `frontend/`: Vite + React customer experience
- `backend/`: NestJS GraphQL + REST API with modular architecture

## Architecture

Backend domains:

- `auth`: signup, login, JWT access/refresh flow, guards
- `account`: profile and customer order views
- `catalog`: product administration and cached listing
- `checkout`: persisted orders and async order jobs
- `support`: FAQs, ticket submission, order lookup
- `health` and `monitoring`: readiness/liveness and metrics
- `jobs`: queue abstraction for async workflows

Cross-cutting backend concerns:

- global validation and exception handling
- structured logging with `pino`-style output
- request logging, rate limiting, and security headers
- GraphQL depth and complexity protection
- environment validation and production-aware config

## Quick Start

### 1. Install dependencies

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

Copy the tracked example files for each workspace and fill them with your own secrets before running the apps locally:

- `backend/.env` (copy from `backend/.env.example`)
- `backend/.env.development`
- `backend/.env.production`
- `frontend/.env` (optional override copied from `frontend/.env.example`)

Only the `*.env.example` files live in source control; the generated `.env*` files with real credentials should remain local and are ignored by Git.

### 4. Run migrations and seed data

```bash
cd backend
npm run migration:run
npm run seed:dev
```

### 5. Start the app

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## Environment Variables

Backend expects these important variables (see `backend/.env.example` for a safe placeholder set):

- `NODE_ENV`: `development`, `test`, or `production`
- `PORT`: backend port
- `USE_IN_MEMORY_DB`: `0` for PostgreSQL, `1` for local fallback
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGIN`
- `RATE_LIMIT_TTL_MS`
- `RATE_LIMIT_MAX`
- `GRAPHQL_MAX_DEPTH`
- `GRAPHQL_MAX_COMPLEXITY`
- `CACHE_TTL_MS`
- `LOG_LEVEL`
- `PRODUCT_IMAGE_UPLOAD_DIR`
- `PRODUCT_IMAGE_BASE_URL`

## Secret handling

- Treat the `.env.example` files in `backend/` and `frontend/` as the canonical, shareable templates for each workspace.
- Copy them to `.env`, `.env.development`, etc., and inject your real credentials from a vault or local secret storage—never check those files in.
- The repository ignores `.env*` at every level, so committing secrets is not necessary; keep production values in your deployment platform or encrypted storage service and only load them into the runtime when needed.

## Asset storage notes

- Admin product images still land in `frontend/public/products` by default, but `PRODUCT_IMAGE_UPLOAD_DIR` lets you point uploads to a different filesystem location and `PRODUCT_IMAGE_BASE_URL` controls the returned URL prefix.
- The frontend and future cloud deployments can reuse the same `ProductImageStorage` abstraction; swapping in an S3/Cloudinary implementation only requires providing the new adapter via Nest providers and wiring the same controller outcome.

## API and Versioning

REST infrastructure endpoints support URI versioning with `v1`, while remaining backward-compatible for unversioned health/metrics routes.

Examples:

## Clean-sharing workflow

- Run `npm run export:source -- --output=/path/to/golf-ecommerce-source.zip` to create a clean, zipped archive. The script lives at `scripts/export-source.mjs` and simply calls `git archive` on `HEAD` so every exported file is a tracked source file (no `.git`, `node_modules`, caches, coverage reports, or ignored env files slip in).
- Before packaging, make sure there are no untracked files that need to be shared; the script only bundles tracked files, so any new helpers should be staged or committed first.
- If you need to document the workflow or preferred exclusions, see `docs/source-export.md` for the finer details on what stays out of shared zips.

- `GET /health`
- `GET /v1/health`
- `GET /health/ready`
- `GET /v1/metrics`

GraphQL endpoint:

- `POST /graphql`

## Example GraphQL Operations

Signup:

```graphql
mutation Signup {
  signup(
    input: {
      email: "golfer@example.com"
      phone: "+1 555 222 3333"
      password: "Password123!"
    }
  ) {
    accessToken
    refreshToken
    user {
      id
      email
      role
    }
  }
}
```

Paginated catalog:

```graphql
query AdminCatalog {
  adminCatalogProducts(input: { page: 1, limit: 20, includeInactive: true }) {
    total
    page
    limit
    items {
      id
      name
      brand
      imageUrl
      price
    }
  }
}
```

Checkout:

```graphql
mutation PlaceOrder {
  placeOrder(
    input: {
      contactEmail: "golfer@example.com"
      contactPhone: "+1 555 222 3333"
      deliveryName: "Jordan Golf"
      deliveryAddressLine1: "123 Fairway Lane"
      deliveryCity: "San Diego"
      deliveryRegion: "CA"
      deliveryPostalCode: "92101"
      deliveryCountry: "United States"
      shippingMethod: STANDARD
      paymentMethod: CARD
      cardHolderName: "Jordan Golf"
      cardNumberMasked: "**** **** **** 4242"
      cardExpiry: "12/28"
      items: [
        {
          id: "prod-driver-1"
          brand: "TaylorMade"
          name: "Qi10 Max Driver"
          quantity: 1
          unitPrice: 599.99
        }
      ]
    }
  ) {
    id
    orderNumber
    total
    createdAt
  }
}
```

## Health, Monitoring, and Jobs

Health endpoints:

- `/health`
- `/health/live`
- `/health/ready`

Metrics endpoint:

- `/metrics`

Queue usage:

- order placement enqueues `orders.process`
- order processing enqueues `email.order-confirmation`
- handlers live in `backend/src/checkout/order-jobs.service.ts`

This is intentionally lightweight and ready to be replaced with BullMQ, SQS, RabbitMQ, or Redis-backed queues later.

## Deployment

### Local production-style container run

```bash
docker compose -f docker-compose.prod.yml up --build
```

### Production container structure

- multi-stage backend build in `backend/Dockerfile`
- runtime image installs production dependencies only
- PostgreSQL runs separately via compose or managed DB
- app config comes from env files or platform secrets

## Project Structure

```text
backend/
  src/
    account/
    auth/
    catalog/
    checkout/
    config/
    database/
    health/
    jobs/
    logging/
    monitoring/
    security/
    shared/
    support/
frontend/
docker-compose.yml
docker-compose.prod.yml
```

## Portfolio Highlights

- Modular NestJS architecture
- GraphQL + REST hybrid backend
- JWT auth with refresh tokens
- Structured logging and global exception handling
- Production-ready config validation and health endpoints
- Cached catalog reads and paginated APIs
- Database migrations and development seed flow
- Async queue pattern for post-checkout workflows
