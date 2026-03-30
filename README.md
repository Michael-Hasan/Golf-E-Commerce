# Golf E-Commerce

Monorepo layout:

- **`backend/`** — NestJS GraphQL API (`npm run start:dev` from this folder, or `npm run dev:backend` from the repo root).
- **`frontend/`** — Vite + React storefront (`npm run dev` from this folder, or `npm run dev` from the repo root).

## Quick start

1. **Database (optional):** from the repo root, `docker compose up -d` for PostgreSQL. Set `USE_IN_MEMORY_DB=0` in `backend/.env` to use it.
2. **Backend:** `cd backend && npm install && npm run start:dev` (or `npm run dev:backend` from root).
3. **Frontend:** `cd frontend && npm install && npm run dev` (or `npm run dev` from root).

Environment templates: `backend/.env.example`, `frontend/.env.example`.
