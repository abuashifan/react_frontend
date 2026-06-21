# Issue-32 — Phase 29 AR Subledger and Reports

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 29  
Severity tertinggi: Critical  
Finding canonical: A13-155..160  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 29 memulihkan AR summary, aging, reconciliation, customer ledger, dan invoice ledger.

---

## Scope Finding

- A13-155..160

---

## Root Cause

- report adapter membaca field yang salah atau tidak lengkap;
- cutoff/as-of logic tidak canonical;
- reconciliation renderer belum aman terhadap shape report;
- running balance/aged bucket contract belum dipetakan eksplisit.

---

## Candidate Frontend Files

```text
src/modules/sales/ar/pages/*
src/modules/sales/ar/services/*
src/modules/sales/ar/hooks/*
src/modules/reports/pages/*
src/modules/reports/services/*
```

## Candidate Backend Files

```text
app/Modules/Sales/Reports/*
app/Modules/Reports/*
tests/Feature/*
```

---

## Acceptance

- lima surface AR tidak crash;
- totals UI sama dengan response/test fixture;
- mismatch terlihat jelas;
- ledger running balance benar;
- cutoff dan as-of diterapkan konsisten.

---

## Test Plan

- feature test bucket, totals, running balance, mismatch;
- Playwright AR aging/reconciliation/customer ledger/invoice ledger;
- verify empty/error states;
- verify permission and cutoff filter.

