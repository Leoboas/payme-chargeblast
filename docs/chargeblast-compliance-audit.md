# Chargeblast compliance audit

| Requirement | Implementation | Test | Result | Evidence |
| --- | --- | --- | --- | --- |
| Payments table and required columns | `PaymentsDashboard` and typed `Payment` contract | Unit + Playwright | PASS | `tests/payments.test.ts`, `tests/e2e/payments.spec.ts` |
| Search, filters, sorting, pagination | Validated server query contract | Unit tests; combined E2E scenario | PASS | `tests/payment-query.test.ts`, Playwright |
| Local data without credentials | `JsonPaymentRepository`, default `PAYMENTS_DATA_SOURCE=json` | JSON repository test without `DATABASE_URL` | PASS | `tests/payments.test.ts` |
| Fixture alteration, addition and deletion are reflected | Zod parser and injectable JSON repository | Fixture manipulation tests | PASS | `tests/payments.test.ts` |
| PostgreSQL optional and isolated | `PostgresPaymentRepository` only selected explicitly | Isolated Neon project provisioned through the Vercel integration; controlled missing-URL test | PASS | Neon project `payme-chargeblast`, `tests/payments.test.ts` |
| JSON add/delete through a rebuilt UI | Requires a rebuilt fixture deployment | API/unit contract tested; isolated rebuilt browser run not performed | NOT_TESTED | Documented in README |
| JSON/Postgres parity | Same 800 deterministic records in the fixture and Neon | Full field-for-field record comparison plus combined-filter query comparison | PASS | 800 JSON / 800 PostgreSQL / 0 differences; matching total and ordered page |
| Visual Stripe comparison | Existing reference-driven layout and popovers | Screenshot captured; no fresh side-by-side comparison in this audit | NOT_TESTED | `tests/e2e/payments.spec.ts` |
| Custom date range and selected filters | UTC date inputs, inclusive bounds, selected values and per-filter clearing | Query unit test and Playwright with PostgreSQL | PASS | `tests/payment-query.test.ts`, `tests/e2e/payments.spec.ts` |
| Optional navigation, account menu and details | Sidebar, top-bar search, demo account menu and payment details route | Playwright regression | PARTIAL | Customers/Balances are visual placeholders; status-change timestamps and metadata are not available |
| Optional URL filters and column resizing/reordering | Shareable URL state and draggable/resizable columns | Playwright regression | PASS | Layout is not persisted; CSV export covers the displayed page |
| Security checks and dependency audit | Zod validation, allowlists, headers, Next 16 and Prisma 7 | Unit tests, invalid parameters, injection-shaped search, `npm audit --omit=dev --audit-level=high` | PARTIAL | 0 production vulnerabilities; no penetration test performed |
| Advanced balance/availability filters | Illustrative fields calculated from the local fixture | Code inspection | LIMITATION | Not queried from PostgreSQL; not real settlement data |
