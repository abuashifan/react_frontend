# Issue-38 — Phase 35 Period-End Processing

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 35  
Severity tertinggi: Critical  
Finding canonical: A13-272..280  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 35 memulihkan seluruh periode akhir:

- status/checklist;
- run/reopen;
- blocker rendering;
- warning/error handling;
- timezone and default period behavior;
- live readiness without crash.

---

## Scope Finding

- A13-272..280

---

## Root Cause

- API Period-End hidup tapi response shape/behavior tidak canonical;
- checklist renderer salah membaca blocker state;
- run/reopen contract tidak tepat;
- error state disamarkan;
- default period dan timezone perusahaan belum konsisten.

---

## Candidate Frontend Files

```text
src/modules/accounting/pages/PeriodEndPage.tsx
src/modules/accounting/services/*
src/modules/accounting/hooks/*
src/modules/accounting/components/*
```

## Candidate Backend Files

```text
app/Modules/Accounting/PeriodEnd/*
tests/Feature/*
```

---

## Acceptance

- status/checklist tidak 500 pada company valid;
- renderer aman untuk blocked/ready/completed;
- run/reopen memakai contract aktual;
- permission/confirmation benar;
- partial/error result terlihat;
- timezone perusahaan menentukan default period.

---

## Test Plan

- feature test status/checklist/run/reopen;
- Playwright live/route-mock period-end flows;
- verify blocker/warning rendering;
- verify timezone and default period;
- verify permission and confirmation.

