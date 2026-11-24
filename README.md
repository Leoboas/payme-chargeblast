# Payme — Payments dashboard

Payme is a production-style recreation of a payments operations screen, inspired by the Stripe Dashboard visual language while using entirely fictitious local data.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available commands

- `npm run dev` — local development server
- `npm run build` — production build and type validation
- `npm run lint` — lint the project
- `npm run test` — execute unit tests

## Architecture

```text
Browser (Payments dashboard)
          │ GET /api/payments — typed query parameters
          ▼
Next.js route handler
          │ parseQuery (Zod allowlists)
          ▼
PaymentRepository contract
   ┌──────┴─────────────────────┐
   ▼                            ▼
JsonPaymentRepository      PostgresPaymentRepository
data/payments.json         Prisma + PostgreSQL (optional)
   │                            │
   └────────── PaymentPage ─────┘
                │
                ▼
        Paginated table UI
```

- `app/` — Next.js App Router, API routes and styles.
- `components/` — responsive Stripe-inspired workspace and Payments UI.
- `data/payments.json` — canonical, fictional demo fixture with 800 records.
- `lib/payments.ts` — validates the JSON fixture and maps it to the frontend model.
- `lib/payment-query.ts` — Zod query parsing, sorting/pagination and repository adapters.
- `types/` — strict public payment types.
- `prisma/` — optional PostgreSQL schema, migration and deterministic seed.
- `tests/` — unit and browser regression tests.

## Data source: JSON by default

The application defaults to `PAYMENTS_DATA_SOURCE=json` when the variable is omitted. Its canonical fixture is [data/payments.json](data/payments.json): 800 fictional, validated records. JSON mode does not read `DATABASE_URL`, load Prisma at runtime, connect to Neon, run migrations, or run a seed.

To change demo data, edit a record in `data/payments.json` and restart development or rebuild/redeploy production; the JSON is bundled at build time. The API response includes `source: "json"`, which makes the selected source observable. Invalid records fail Zod validation rather than being silently repaired.

`PAYMENTS_DATA_SOURCE=postgres` is an explicit optional mode. It uses the same query contract through `PostgresPaymentRepository` and requires `DATABASE_URL`. A missing or unavailable database returns a controlled API error; it never falls back to JSON while PostgreSQL mode is selected.

Production is configured with `PAYMENTS_DATA_SOURCE=postgres` against an isolated Neon project. Before activation, all 800 fixture records were seeded and compared field-for-field with PostgreSQL (zero differences); a representative combined-filter query also returned the same total and ordered page from both sources.

## PostgreSQL / Neon (optional)

Set the values in `.env.example` in a local `.env` file. `DATABASE_URL` must be a Neon pooled connection for runtime; `DIRECT_URL` must be the direct connection used by Prisma migrations. Prisma 7 uses the PostgreSQL driver adapter at runtime and `prisma7.config.ts` for CLI migrations.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed uses `createMany` with stable payment IDs and `skipDuplicates`, so it is repeatable and contains only fictitious customer data. The API validates all query parameters with Zod, composes Prisma filters (no raw SQL), retrieves only the requested page and applies `id` as a stable final ordering key.

The indexes mirror the dashboard access paths: date/status/method with date sorting, amount sorting, and email search. A standard view is intentionally not used: it would simplify neither this single-table read model nor its performance.

The query adapters implement the same `PaymentRepository` contract: `JsonPaymentRepository` and `PostgresPaymentRepository`. Required filters use `/api/payments`. The demo's extra balance-type and available-at controls currently calculate values from the local fixture, rather than querying PostgreSQL; availability and the two-day date are illustrative and are not real settlement data.

## Features

- Search by payment ID, customer email, and last four card digits
- Combined status, payment method, amount, and date filters
- Date presets and a custom inclusive UTC date range; selected filter values are shown and can be cleared individually
- Sorting by date, amount, and status
- 25 / 50 / 100 item pagination with automatic page correction
- Currency-aware display, accessible filter popovers, copy-to-clipboard feedback and relative date tooltips
- Empty, loading, and retry-ready error state components

No real payment credentials, customer data, or Stripe API calls are used.

## API documentation and security

- OpenAPI contract: `/api/openapi.json`
- Human-readable API guide: `/api-docs`
- The API is read-only and validates all query parameters through Zod.
- Pagination is allowlisted to 25, 50, or 100 rows; sort values are allowlisted.
- Prisma parameterizes database requests; the fixture fallback performs no SQL.
- Security response headers include CSP, `X-Content-Type-Options`, frame protection, referrer policy and permissions policy.
- Structured server error events and fixed browser error categories are written to platform logs. They omit customer details, search text, request URLs and raw error messages. On Vercel, inspect the project's runtime logs; retention follows the platform plan, and this is not a dedicated error-monitoring service.

`npm audit --omit=dev --audit-level=high` reports zero production vulnerabilities after the Next 16, Zod 4 and Prisma 7 upgrades. Prisma's `effect` transitive dependency is pinned through the npm `overrides` field to its patched release.

## Known limitations

- Balance type and available-at are illustrative client-side fields, not stored settlement data; these controls can differ from PostgreSQL if the database and JSON fixture diverge.
- CSV export includes the currently displayed page. The other workspace screens are demo navigation, not complete Stripe features.
- The OpenAPI endpoint is a lightweight contract; an automated schema-conformance or penetration test has not been performed.

## Verification

```bash
npm run test
npx tsc --noEmit
npm run build
npx playwright test
```

The JSON parser tests cover an edited fixture record and JSON operation with no `DATABASE_URL`. The compliance matrix is in [docs/chargeblast-compliance-audit.md](docs/chargeblast-compliance-audit.md).
