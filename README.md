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
- `npm run test` — execute unit tests when added

## Architecture

- `app/` contains the Next.js App Router shell and global styling.
- `components/payments-dashboard.tsx` contains the responsive dashboard, controls and table.
- `lib/payments.ts` generates 800 deterministic, fictitious payments locally.
- `types/payment.ts` provides strict payment data types.
- `app/api/payments/route.ts` exposes validated, server-side paginated queries.
- `prisma/` contains the PostgreSQL schema, migration and deterministic seed.

## PostgreSQL / Neon

Set the values in `.env.example` in a local `.env` file. `DATABASE_URL` must be a Neon pooled connection for runtime; `DIRECT_URL` must be the direct connection used by Prisma migrations.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed uses `createMany` with stable payment IDs and `skipDuplicates`, so it is repeatable and contains only fictitious customer data. The API validates all query parameters with Zod, composes Prisma filters (no raw SQL), retrieves only the requested page and applies `id` as a stable final ordering key.

The indexes mirror the dashboard access paths: date/status/method with date sorting, amount sorting, and email search. A standard view is intentionally not used: it would simplify neither this single-table read model nor its performance.

If `DATABASE_URL` is not set, the `/api/payments` endpoint explicitly uses the deterministic fixture fallback. A configured database error returns an API error; it never becomes an empty result set.

## Features

- Search by payment ID, customer email, and last four card digits
- Combined status, payment method, amount, and date filters
- Sorting by date, amount, and status
- 25 / 50 / 100 item pagination with automatic page correction
- Currency-aware display, accessible filter popovers, copy-to-clipboard feedback and relative date tooltips
- Empty, loading, and retry-ready error state components

No real payment credentials, customer data, or Stripe API calls are used.
