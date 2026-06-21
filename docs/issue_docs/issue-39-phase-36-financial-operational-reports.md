# Issue-39 — Phase 36 Financial and Operational Reports

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 36  
Severity tertinggi: Critical  
Finding canonical: A13-232..253  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 36 memulihkan seluruh laporan finansial dan operasional:

- general ledger;
- trial balance;
- profit and loss;
- balance sheet;
- cash flow;
- financial summary;
- AR/AP aging and reconciliation report surfaces;
- stock and inventory analysis reports.

---

## Scope Finding

- A13-232..253

---

## Root Cause

- report adapters membaca shape lama;
- filter period/date/as-of tidak canonical;
- summary/total/section mapping tidak stabil;
- export/transaction list behavior fiktif atau belum ada;
- report crash tidak tercontain dengan aman.

---

## Candidate Frontend Files

```text
src/modules/reports/pages/*
src/modules/reports/services/*
src/modules/reports/hooks/*
src/modules/reports/components/*
```

## Candidate Backend Files

```text
app/Modules/Reports/*
tests/Feature/*
```

---

## Acceptance

- semua report utama tidak crash pada valid/empty/error response;
- filter canonical terkirim benar;
- totals dan sections memakai field canonical;
- AR/AP aging dan reconciliation memakai adapter domain benar;
- export hanya tampil bila endpoint nyata tersedia;
- report response tidak bocor detail runtime.

---

## Test Plan

- feature test report payload canonical;
- Playwright all major report surfaces;
- verify filter period/date/as-of;
- verify totals, sections, and empty states;
- verify export visibility only when supported.

