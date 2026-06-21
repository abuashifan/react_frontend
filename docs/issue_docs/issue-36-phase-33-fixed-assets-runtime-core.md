# Issue-36 — Phase 33 Fixed Assets Runtime and Core Contract

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 33  
Severity tertinggi: Critical  
Finding canonical: A13-204..214, A13-220..224, A13-229..231  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 33 memulihkan runtime contract Fixed Assets:

- API surfaces yang crash;
- financial field lock/revision;
- partial capitalization;
- period/date guard;
- disposal and depreciation interaction;
- account mapping validation;
- register/reconciliation as-of behavior.

---

## Scope Finding

- A13-204..214
- A13-220..224
- A13-229..231

---

## Root Cause

- API response shape fixed assets belum canonical;
- financial state editability belum dikunci dengan benar;
- partial capitalization dan disposal rules tidak tegas;
- period/date guard belum diterapkan pada semua effect;
- category mapping and report cutoff belum tervalidasi.

---

## Candidate Frontend Files

```text
src/modules/fixed-assets/pages/*
src/modules/fixed-assets/services/*
src/modules/fixed-assets/hooks/*
src/modules/fixed-assets/components/*
```

## Candidate Backend Files

```text
app/Modules/FixedAssets/*
tests/Feature/*
```

---

## Acceptance

- semua surface API fixed assets dapat dibuka tanpa crash;
- financial field locked/revised sesuai workflow resmi;
- partial capitalization benar;
- depreciation and disposal relation benar;
- account mapping tervalidasi;
- as-of/cutoff behavior konsisten di register/reconciliation.

---

## Test Plan

- feature test core fixed asset flows;
- Playwright list/form/detail/report pages representative;
- verify locked vs editable fields;
- verify period/date guard;
- verify register/reconciliation data cutoff.

