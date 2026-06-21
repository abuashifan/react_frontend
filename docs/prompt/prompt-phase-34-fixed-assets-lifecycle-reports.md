# Prompt — Phase 34: Fixed Assets Lifecycle and Historical Reports

**Phase**: 34  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-37-phase-34-fixed-assets-lifecycle-reports.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-37-phase-34-fixed-assets-lifecycle-reports.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/fixed-assets/*
src/modules/reports/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Fixed Assets/Reports yang relevan.

---

## 1. Tujuan Phase

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

## 2. Non-Negotiable Guardrails

- Jangan mengubah lifecycle transition menjadi free edit.
- Jangan membiarkan depreciation berjalan setelah disposal.
- Jangan menyembunyikan report cutoff mismatch dengan fallback palsu.
- Jangan crash pada empty/error report response.

---

## 3. Tugas Utama

### Step 1 - Lifecycle rules

Pastikan transition lifecycle eksplisit dan traceable.

### Step 2 - Historical report safety

Pastikan register/reconciliation report:

- menghormati cutoff/as-of;
- memiliki journal/source linkage;
- aman pada empty/error response.

### Step 3 - Disposal and depreciation

Pastikan disposal menghentikan depreciation sesuai rule canonical.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- lifecycle transition eksplisit;
- depreciation berhenti pada disposal;
- register/reconciliation report aman;
- as-of cutoff benar.
