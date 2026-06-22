# Phase 28 Completion and Validation Report

Date: 2026-06-22

## Scope

- Finding count: 19
- Finding IDs: A13-136..A13-154
- Resources: quotation, sales order, delivery order, proforma, invoice,
  customer deposit, receipt, return, and Sales transaction lists

## Contract decisions

- UI dates are adapted to each resource-specific backend field.
- Detail/list DTOs are normalized inside the Sales service boundary.
- Create drafts are isolated by company and resource.
- Derived documents use the source picker and retain source-line metadata.
- Sales returns require an invoice or delivery source and a source line.
- Optional financial dimensions remain optional; source metadata and warehouse
  fields are preserved where inventory posting needs them.
- Lifecycle mutations require confirmation; reject/cancel/void require reasons.

## Changes

- Frontend: shared transaction/list adapters, line validation, draft persistence,
  source workflows, deposit allocation/refund/apply, receipt customer context,
  canonical permissions/statuses, confirmations, server filters/page size, and
  explicit query error states.
- Backend: source availability for invoice/return flows, customer filtering,
  relation eager loading, receipt account/invoice relations, and mandatory
  source-linked returns.

## Automated verification

- Frontend build: passed.
- Frontend lint: passed with the existing RHF/useMemo warnings.
- Playwright route-mock: `tests/e2e/sales/sales-transaction.spec.ts`.
- Backend Sales suite: 122 tests passed.
- Backend return regression: unlinked header and line sources are rejected.

## Finding reconciliation

| Finding | Evidence | Status |
|---|---|---|
| A13-136 | Resource-specific request adapter + build | verified |
| A13-137 | Detail adapter + receipt Playwright fixture | verified |
| A13-138 | Shared line validator on item and receipt forms | verified |
| A13-139 | Persistent draft rollout on create forms | verified |
| A13-140 | Source picker flows + remaining quantity | verified |
| A13-141 | Canonical create/edit/lifecycle permission keys | verified |
| A13-142 | Confirm dialogs and required cancel/reject reasons | verified |
| A13-143 | Deposit allocate/refund and invoice apply amount UI | verified |
| A13-144 | Receipt relation adapter and customer exposure context | verified |
| A13-145 | Backend feature test + return source Playwright test | verified |
| A13-146 | Optional dimensions/source metadata preserved; warehouse exposed | verified |
| A13-147 | Zod cross-date refinements + API field mapping | verified |
| A13-148 | Partial/delivered/invoiced status union and badges | verified |
| A13-149 | Query error/retry and API field feedback on forms | verified |
| A13-150 | Accessible source dialog and transaction line action names | verified |
| A13-151 | Shared list DTO adapter for all Sales resources | verified |
| A13-152 | Search/customer/status/date backend query flow | verified |
| A13-153 | Dynamic 25/50/100 page size state | verified |
| A13-154 | List and AR summary API error states | verified |

## Reconciliation totals

- Coverage findings: 19
- Checklist rows: 19
- Verified: 19
- Failed: 0
- Blocked: 0

## Exit decision

Phase complete. Phase 29 may start.

## Residual risk

Live mutation verification remains restricted to a disposable tenant. The
current evidence is deterministic browser runtime plus the isolated backend
Sales feature suite.
