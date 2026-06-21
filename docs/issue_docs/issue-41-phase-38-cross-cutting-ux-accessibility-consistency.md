# Issue-41 — Phase 38 Cross-Cutting UX, Accessibility, and Consistency

Tanggal dibuat: 2026-06-21  
Status: Planned  
Phase: 38  
Severity tertinggi: Medium  
Finding canonical: P2/P3 lintas modul  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## Tujuan

Phase 38 menutup temuan P2/P3 yang tersisa setelah behavior utama stabil:

- accessibility consistency;
- button semantics;
- label/control association;
- dialog descriptions;
- short viewport/mobile polish;
- loading/error/empty copy;
- lint warning pada file yang disentuh.

---

## Scope Finding

Semua finding P2/P3 yang belum tertutup setelah Phase 25–37.

---

## Root Cause

- banyak issue kecil berasal dari pola shared yang belum seragam;
- beberapa surface masih memiliki copy/error state yang belum konsisten;
- viewport pendek memunculkan scroll/overflow dan label alignment issues;
- lint warnings lama belum dibereskan pada file yang disentuh phase sebelumnya.

---

## Candidate Frontend Files

```text
src/modules/**/*
src/components/shared/**/*
src/lib/**/*
```

## Candidate Backend Files

Hanya jika ditemukan regresi contract kecil yang memang berasal dari backend dan tidak bisa diselesaikan di frontend saja.

---

## Acceptance

- tidak ada known unlabeled critical control;
- tidak ada root overflow pada matrix viewport yang diuji;
- dialog semantics dan copy konsisten;
- loading/error/empty states jelas;
- lint tidak mendapat warning baru pada file yang disentuh;
- shared pattern dipakai ulang, bukan redesign besar.

---

## Test Plan

- accessibility smoke per module representative;
- Playwright viewport matrix;
- keyboard/focus/dialog checks;
- lint on touched files;
- visual sanity on pages with known small issues.

