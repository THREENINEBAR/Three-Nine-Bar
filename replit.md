# THREE NINE BAR INVENTORY SYSTEM

A full-stack bar inventory management system for cocktail bars with role-based access, automatic stock calculations, sales tracking, wasting logs, and reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/three-nine-bar run dev` — run the frontend (port 21572)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret

## Default Credentials

- **Admin**: username `admin` / password `admin123`
- **Staff**: username `staff1` / password `staff123`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Recharts, shadcn/ui
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — database schema (Drizzle tables)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/three-nine-bar/src/` — React frontend

## Architecture decisions

- Auth via express-session (cookie-based, no JWT). Session secret from env var.
- Stock is tracked directly on `ingredients.current_stock` and adjusted on every sale/wasting/stock-add.
- `stock_movements` table records every IN/OUT/WASTING event for audit trail.
- Stock Opname is computed (read-only) from movements + current stock; OUT is never entered manually.
- Sales deduct stock atomically: check sufficiency → create sale → deduct ingredients → record movements.
- Recipes use a `recipes` + `recipe_details` table; one recipe per product.

## Product

**Admin can access:** Dashboard, Data Bahan, Data Product, Data Resep, Product Sale, Wasting, Stock Opname, Laporan, User Management

**Staff can access:** Stock Opname, Product Sale, Wasting

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- After schema changes in `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push`
- `SESSION_SECRET` env var must be set or API server throws on start
- Never manually edit the `current_stock` field without also inserting a `stock_movements` row
- `db.sql` is not valid — always import `sql` from `drizzle-orm`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
