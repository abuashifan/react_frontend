# Issue-33 — Phase 30 Purchase Transaction Contract

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 30  
Severity tertinggi: Critical  
Finding canonical: A13-161..179  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 30 memperbaiki seluruh kontrak transaksi Purchase dalam satu pola adapter canonical:

- purchase request;
- purchase order;
- goods receipt;
- vendor bill;
- payment;
- deposit;
- return.

---

## Scope Finding

- A13-161..179

---

## Root Cause

- request adapter form tidak canonical;
- detail response/line relation tidak stabil;
- draft persistence belum seragam;
- source conversion dan return policy belum mengikuti contract canonical;
- line validation dan permission/lifecycle belum selaras antar halaman.

---

## Candidate Frontend Files

```text
src/modules/purchase/pages/*
src/modules/purchase/services/*
src/modules/purchase/hooks/*
src/modules/purchase/components/*
```

## Candidate Backend Files

```text
app/Modules/Purchase/*
tests/Feature/*
```

---

## Acceptance

- seluruh payload valid UI diterima backend;
- detail round-trip sama dengan data tersimpan;
- source conversion tidak over-convert;
- draft tidak hilang;
- return tidak melewati accounting/inventory control;
- lifecycle action dan permission konsisten.

---

## Test Plan

- feature test create/update/post/void/source;
- Playwright form create/detail/edit per resource representative;
- verify source picker and remaining quantity/amount;
- verify draft persistence;
- verify error/not-found/permission states.

