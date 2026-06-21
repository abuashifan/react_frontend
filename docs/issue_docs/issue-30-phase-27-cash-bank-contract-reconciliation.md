# Issue-30 — Phase 27 Cash and Bank Contract and Reconciliation

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 27  
Severity tertinggi: Critical  
Finding canonical: A13-116..135  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 27 menstabilkan seluruh surface Cash & Bank:

- cash receipt;
- cash payment;
- bank transfer;
- reconciliation;
- post/void contract;
- statement/cutoff behavior.

---

## Scope Finding

- A13-116..135

---

## Root Cause

- request/response adapter per resource belum canonical;
- relation/account selectors tidak selalu valid;
- same-account transfer dan cutoff validation belum konsisten;
- post/void/reconcile lifecycle belum dihormati di semua layer;
- refresh/mark lines berisiko kehilangan state tanpa explicit policy.

---

## Candidate Frontend Files

```text
src/modules/cash-bank/pages/*
src/modules/cash-bank/services/*
src/modules/cash-bank/hooks/*
src/modules/cash-bank/components/*
```

## Candidate Backend Files

```text
app/Modules/CashBank/*
tests/Feature/*
```

---

## Acceptance

- create/detail/post/void seluruh cash-bank lulus;
- transfer tidak dapat memakai akun sama;
- reconciliation menampilkan opening/ending/cleared/difference benar;
- refresh/mark lines tidak menyebabkan state hilang diam-diam;
- journal effect balanced dan traceable.

---

## Test Plan

- feature test posting, void, reconciliation, balance;
- Playwright receipt/payment/transfer/reconciliation;
- verify cleared date period validation;
- verify line refresh policy;
- verify permission and lifecycle states.

