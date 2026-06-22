# Phase 29 Completion and Validation Report

Date: 2026-06-22

## Scope

- Finding count: 6
- Finding IDs: A13-155, A13-156, A13-157, A13-158, A13-159, A13-160
- Modules: Sales / AR (summary, aging, reconciliation, customer ledger, invoice
  ledger)

## Contract decisions

- All five AR surfaces consume canonical view models through a dedicated Sales AR
  adapter (`src/modules/sales/services/arAdapter.ts`). The adapter reads the
  object-shaped backend responses and never calls array methods on the raw
  aggregate object.
  - Aging: `{ as_of_date, buckets, total, customers[] }` → `{ as_of_date, rows[], totals }`.
  - Reconciliation: `{ subsidiary_balance, gl_ar_balance, difference, is_reconciled }`.
  - Customer/invoice ledger: `{ customer_id|invoice_id, movements[] }` → typed
    entries with server-provided running balance.
  - Summary: official/gross AR balance, unapplied deposit, net exposure, and AR
    accounts from the canonical fields (no `total_receivable`/`overdue_amount`
    guesswork).
- AR date filters are canonical end-to-end: the frontend sends `as_of_date`,
  `start_date`, and `end_date`; the backend reads the same keys, and the invoice
  ledger controller accepts the request/filter.
- Reconciliation route permission is unified on `sales.ar.reconcile` on both the
  frontend route guard and the backend route middleware.
- Cutoff/as-of is applied consistently. Date-cast columns serialize as
  `Y-m-d 00:00:00`, so boundary rows are matched with `whereDate(...)` on both
  the subledger and GL sides to avoid phantom reconciliation differences.

## Changes

- Frontend:
  - `services/arAdapter.ts` (new): canonical adapters for summary, aging,
    reconciliation, customer ledger, invoice ledger.
  - `services/arApi.ts`, `types/ar.types.ts`, `hooks/useArData.ts`: typed
    request/response, canonical params (`as_of_date`/`start_date`/`end_date`).
  - `pages/ArSummaryPage`, `ArAgingPage`, `ArReconciliationPage`,
    `CustomerLedgerPage`, `InvoiceLedgerPage`: render rows/totals/running balance
    from the adapter, with distinct loading / empty / error states and visible
    mismatch.
  - `routes.tsx`: reconciliation route guarded by `sales.ar.reconcile`.
- Backend:
  - `Services/Sales/ARSubsidiaryLedgerService`: `whereDate(...)` for the
    start/end date cutoff on invoice, receipt, deposit-allocation, and return
    movements so the boundary date is inclusive.
  - `Services/Sales/ARReconciliationService`: `whereDate(...)` for the GL
    `journal_date` cutoff, keeping it symmetric with the subledger side.
- Migration: none.

## Automated verification

- Frontend build: passed (`npm run build`, 0 TypeScript errors).
- Frontend lint: passed (0 errors; 28 pre-existing RHF/useMemo warnings in files
  not touched by this phase).
- Backend feature tests: `AccountsReceivableLedgerTest` 9/9 passed (108
  assertions); full Sales suite 160/160 passed (1111 assertions).
- Pint: passed for all changed AR files.

## Runtime environment

- frontend-local (build/lint) and backend-local (feature tests). No live retest
  performed this session; the canonical object-shaped responses are exercised by
  the backend feature tests that the frontend adapter mirrors.

## Finding reconciliation

| Finding | Automated | Runtime | Invariant | Regression | Status | Evidence |
|---|---|---|---|---|---|---|
| A13-155 | AR aging test (buckets/totals) | backend-local | aging totals = sum of buckets | none | verified | adapter reads `customers[]`/`buckets`; page renders rows+totals |
| A13-156 | reconciliation tests | backend-local | subsidiary/GL/difference rendered | none | verified | adapter reads aggregate object; page renders metrics + mismatch |
| A13-157 | customer + invoice ledger tests | backend-local | running balance monotonic from movements | none | verified | adapter reads `movements[]`; pages render running balance + ending balance |
| A13-158 | customer-summary test | backend-local | official/gross/unapplied/net from canonical fields | none | verified | adapter + summary page use canonical metric fields |
| A13-159 | invoice ledger cutoff test | backend-local | `as_of_date`/`start_date`/`end_date` honored | fixed boundary cutoff | verified | controller accepts filter; `whereDate` cutoff inclusive |
| A13-160 | route guard inspection + route middleware | source | route + API permission identical | none | verified | `sales.ar.reconcile` on FE guard and BE route |

## Reconciliation totals

- Coverage findings: 6
- Checklist rows: 6
- Verified: 6
- Failed: 0
- Blocked: 0
- Regression new: 0 (1 pre-existing boundary-cutoff defect fixed under A13-159
  scope, covered by a new regression test)

## Exit decision

- Phase complete.
- Reason: all six findings verified with automated backend tests and frontend
  build/lint; the cutoff boundary defect surfaced during validation was fixed
  within scope and locked with regression tests.

## Residual risk

- No live (browser) retest this session; recommend a live route-mock/live-read
  pass on `app.finlite.my.id` before closing the GAP-10 phase gate if a runtime
  audit is required.
- Aging uses current `balance_due` rather than a historical as-of balance; the
  as-of cutoff governs which invoices are included and their due-date bucket,
  not a point-in-time reconstruction of paid amounts. Out of scope for A13-155.

## Next phase

- Phase 30 — AP subledger/reports (mirror of this work for Purchase/AP),
  dependency Phase 24–27 per GAP-10 §15.
