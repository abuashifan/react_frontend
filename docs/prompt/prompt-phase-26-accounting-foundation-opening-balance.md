# Prompt — Phase 26: Accounting Foundation and Opening Balance

**Phase**: 26  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-29-phase-26-accounting-foundation-opening-balance.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-29-phase-26-accounting-foundation-opening-balance.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/accounting/*
src/modules/opening-balance/*
```

Jika backend diperbaiki, baca backend `AGENTS.md` dan modul accounting/opening balance yang relevan.

---

## 1. Tujuan Phase

Phase 26 menstabilkan jurnal, period lock, fiscal year, dan opening balance sebelum transaksi lanjutan.

Target:

- journal list/detail/create contract;
- immutable posted state;
- opening balance status/preview/batch;
- fiscal year close/reopen;
- period/date guard yang konsisten.

---

## 2. Non-Negotiable Guardrails

- Jangan menyamarkan error backend sebagai empty state.
- Jangan membiarkan posted item tetap editable.
- Jangan memalsukan totals atau labels agar UI tampak bekerja.
- Jangan menonaktifkan period/date guard untuk melewati test.
- Jangan ubah route behavior yang tidak terkait phase ini.

---

## 3. Tugas Utama

### Step 1 - Journal contract

Pastikan list/detail/form jurnal memakai field canonical backend:

- totals;
- relation labels;
- status lifecycle;
- read-only posted behavior;
- error handling yang aman.

### Step 2 - Opening balance

Stabilkan:

- status contract;
- preview/checklist;
- batch lifecycle;
- blocker rendering;
- error state yang jelas saat backend gagal.

### Step 3 - Fiscal year and period guard

Pastikan close/reopen dan lock/unlock:

- memakai ID/route yang canonical;
- menjalankan preview/checklist bila diwajibkan backend;
- menjaga period/date guard;
- tidak menghapus audit trail.

### Step 4 - UI state and permissions

- posted/approved state harus read-only;
- action button mengikuti permission;
- detail render tidak crash pada blocker object;
- error/empty/loading state dibedakan.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- journal list/detail konsisten dan balanced;
- opening balance tidak crash;
- lock aktif terbaca benar;
- close/reopen lewat flow canonical;
- posted item tidak dapat diedit;
- no hidden `NaN`/`Invalid Date`.
