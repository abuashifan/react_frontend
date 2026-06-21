# Issue-37 — Phase 34 Fixed Assets Lifecycle and Historical Reports

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 34  
Severity tertinggi: Critical  
Finding canonical: A13-215..219, A13-225..228  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 34 menutup lifecycle dan historical reporting Fixed Assets:

- acquisition;
- capitalization;
- depreciation;
- transfer;
- revaluation;
- impairment;
- disposal;
- register report;
- reconciliation report;
- as-of historical behavior.

---

## Scope Finding

- A13-215..219
- A13-225..228

---

## Root Cause

- lifecycle transition rules belum eksplisit;
- report cutoff/as-of belum canonical;
- journal/source linkage historical report belum stabil;
- disposal effect belum menghentikan depreciation dengan benar;
- report adapter belum aman terhadap shape/empty/error.

---

## Candidate Frontend Files

```text
src/modules/fixed-assets/pages/*
src/modules/fixed-assets/services/*
src/modules/fixed-assets/hooks/*
src/modules/reports/pages/*
src/modules/reports/services/*
```

## Candidate Backend Files

```text
app/Modules/FixedAssets/*
app/Modules/Reports/*
tests/Feature/*
```

---

## Acceptance

- lifecycle transition eksplisit dan traceable;
- depreciation berhenti pada disposal;
- report register/reconciliation menghormati cutoff/as-of;
- no crash pada empty/error response;
- journal/source linkage tersedia di report.

---

## Test Plan

- feature test lifecycle and historical report cases;
- Playwright disposal/reconciliation/register;
- verify as-of cutoff;
- verify no post-disposal depreciation;
- verify report safety.

