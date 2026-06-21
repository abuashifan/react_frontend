# Prompt — Phase 33: Fixed Assets Runtime and Core Contract

**Phase**: 33  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-36-phase-33-fixed-assets-runtime-core.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-36-phase-33-fixed-assets-runtime-core.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/fixed-assets/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Fixed Assets yang relevan.

---

## 1. Tujuan Phase

Phase 33 memulihkan runtime contract Fixed Assets:

- API surfaces yang crash;
- financial field lock/revision;
- partial capitalization;
- period/date guard;
- disposal and depreciation interaction;
- account mapping validation;
- register/reconciliation as-of behavior.

---

## 2. Non-Negotiable Guardrails

- Jangan membiarkan financial fields editable tanpa workflow resmi.
- Jangan menyembunyikan partial capitalization/disposal mismatch.
- Jangan melepas period/date guard untuk menutup crash.
- Jangan crash pada register/reconciliation/report surfaces.

---

## 3. Tugas Utama

### Step 1 - Runtime safety

Pastikan seluruh surface API fixed assets dapat dibuka tanpa crash.

### Step 2 - Financial state

Pastikan financial field lock/revision dan partial capitalization mengikuti contract canonical.

### Step 3 - Period and mapping guard

Pastikan:

- period/date guard diterapkan;
- account mapping tervalidasi;
- register/reconciliation as-of konsisten;
- disposal menghentikan depreciation sesuai rule.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- fixed assets list/form/detail/report representative screens work;
- locked fields benar;
- partial capitalization benar;
- cutoff benar;
- no route/tab regression.
