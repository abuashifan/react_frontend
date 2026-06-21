# Issue-35 — Phase 32 Inventory Integrity and Workflow

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 32  
Severity tertinggi: Critical  
Finding canonical: A13-186..203  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 32 menstabilkan inventory master and workflow:

- stock balance;
- movement;
- adjustment;
- opname;
- negative stock behavior;
- source and cutoff contract.

---

## Scope Finding

- A13-186..203

---

## Root Cause

- stock adapters tidak canonical;
- detail route/report shape belum stabil;
- filter/cutoff/date handling belum konsisten;
- negative stock and movement source policy belum eksplisit;
- workflow write path belum aman terhadap lifecycle and permission.

---

## Candidate Frontend Files

```text
src/modules/inventory/pages/*
src/modules/inventory/services/*
src/modules/inventory/hooks/*
src/modules/inventory/components/*
```

## Candidate Backend Files

```text
app/Modules/Inventory/*
tests/Feature/*
```

---

## Acceptance

- product/stock balance/detail tidak crash;
- movement/adjustment/opname request dan response canonical;
- negative stock policy tampak jelas;
- cutoff/as-of diterapkan benar;
- source and lifecycle behavior traceable.

---

## Test Plan

- feature test stock balance/detail/movement/adjustment/opname;
- Playwright inventory pages representative;
- verify filter and as-of handling;
- verify negative stock and source policy;
- verify permission and lifecycle states.

