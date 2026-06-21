# Issue-34 — Phase 31 AP Subledger and Reports

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 31  
Severity tertinggi: Critical  
Finding canonical: A13-180..185  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 31 memulihkan AP summary, aging, reconciliation, vendor ledger, dan bill ledger.

---

## Scope Finding

- A13-180..185

---

## Root Cause

- report adapter membaca field yang salah atau tidak lengkap;
- cutoff/as-of logic tidak canonical;
- reconciliation renderer belum aman terhadap shape report;
- running balance/aged bucket contract belum dipetakan eksplisit.

---

## Candidate Frontend Files

```text
src/modules/purchase/ap/pages/*
src/modules/purchase/ap/services/*
src/modules/purchase/ap/hooks/*
src/modules/reports/pages/*
src/modules/reports/services/*
```

## Candidate Backend Files

```text
app/Modules/Purchase/Reports/*
app/Modules/Reports/*
tests/Feature/*
```

---

## Acceptance

- lima surface AP tidak crash;
- totals UI sama dengan response/test fixture;
- mismatch terlihat jelas;
- ledger running balance benar;
- cutoff dan as-of diterapkan konsisten.

---

## Test Plan

- feature test bucket, totals, running balance, mismatch;
- Playwright AP aging/reconciliation/vendor ledger/bill ledger;
- verify empty/error states;
- verify permission and cutoff filter.

