# Phase 27 Completion and Validation Report

Date: 2026-06-21

## Scope

- Finding count: 20
- Finding IDs: A13-116..A13-135
- Modules: Cash Receipt, Cash Payment, Bank Transfer, Bank Reconciliation

## Contract decisions

- Allocation lines are mandatory and must equal the header amount.
- Draft cash transactions support canonical PATCH updates.
- Active `is_cash_bank` accounts come from `/cash-bank/accounts`.
- Reconciliation refresh preserves cleared state by journal line identity.
- Difference is opening plus cleared net movement minus ending.
- Finalize requires zero difference; reopen requires an audit reason.

## Changes

- Frontend: typed adapters, RHF/Zod nested lines, dimensions/currency fields,
  server-side filters, error states, confirmations, accessibility labels, and
  reconciliation lifecycle/layout.
- Backend: required lines, draft updates, eager-loaded relations, filter support,
  safe refresh, period-bounded cleared dates, finalize/reopen endpoints.
- Migration: reopen audit fields on `bank_reconciliations`.

## Automated verification

- Frontend build: passed.
- Frontend lint: passed with 28 pre-existing warnings outside Cash & Bank.
- Playwright route-mock: `tests/e2e/cash-bank/cash-bank.spec.ts`.
- Backend: `php artisan test --filter=CashBank` — 25 tests, 131 assertions.
- Pint: changed CashBank files.

## Finding reconciliation

| Finding | Evidence | Invariant | Status |
|---|---|---|---|
| A13-116 | Playwright required-line + backend request test | At least one valid line | verified |
| A13-117 | Playwright mismatch + backend amount test | Header equals line sum | verified |
| A13-118 | Account picker + backend guard | Active cash/bank only | verified |
| A13-119 | Adapter render + eager-load assertion | Account code/name retained | verified |
| A13-120 | Draft edit + PATCH tests | Only draft editable | verified |
| A13-121 | Query-param capture + filtered query | Filter before pagination | verified |
| A13-122 | 500/404 error surface | Error is not empty/draft | verified |
| A13-123 | Post confirmation | Journal mutation is explicit | verified |
| A13-124 | Currency/dimension round-trip | Supported fields retained | verified |
| A13-125 | Playwright role/label queries | Accessible names | verified |
| A13-126 | Same-account frontend/backend tests | Transfer accounts differ | verified |
| A13-127 | Canonical journal-line fixture | DTO rendered accurately | verified |
| A13-128 | Immutable account/period test | Ignored fields not editable | verified |
| A13-129 | Refresh payload + preservation test | Cleared state retained | verified |
| A13-130 | Zero-difference fixture | Opening + net - ending | verified |
| A13-131 | Finalize/reopen tests | Finalized state locked | verified |
| A13-132 | Min/max + backend rejection | Cleared date within period | verified |
| A13-133 | Zod/backend date validation | End not before start | verified |
| A13-134 | Account/period/search capture | Filters server-side | verified |
| A13-135 | Bounding-box check | Summary above action bar | verified |

## Reconciliation totals

- Coverage findings: 20
- Checklist rows: 20
- Verified: 20
- Failed: 0
- Blocked: 0
- Regression new: 0

## Exit decision

Phase complete. Phase 28 may start.

## Residual risk

Live verification requires deployment of both repositories and the tenant
migration; current evidence is backend-local plus deterministic browser runtime.
