# Prompt — Phase 35: Period-End Processing

**Phase**: 35  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-38-phase-35-period-end-processing.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-38-phase-35-period-end-processing.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/accounting/pages/PeriodEndPage.tsx
src/modules/accounting/services/*
src/modules/accounting/hooks/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Period-End yang relevan.

---

## 1. Tujuan Phase

Phase 35 memulihkan status/checklist period-end, run/reopen, blocker rendering, warning/error handling, dan timezone/default period behavior.

---

## 2. Non-Negotiable Guardrails

- Jangan menyamarkan backend error sebagai ready/empty.
- Jangan membuat checklist blocker terlihat selesai padahal belum.
- Jangan menjalankan run/reopen tanpa permission/confirmation yang benar.
- Jangan mengabaikan timezone perusahaan saat menentukan default period.

---

## 3. Tugas Utama

### Step 1 - Status and checklist

Pastikan status dan checklist period-end memakai contract backend aktual dan menampilkan blocker/warning dengan benar.

### Step 2 - Run/reopen flow

Pastikan run/reopen:

- mengikuti permission;
- memakai confirmation;
- menampilkan state loading/error yang jelas;
- tidak crash saat backend error.

### Step 3 - Timezone and defaults

Pastikan default period dan timezone perusahaan konsisten dan tidak bergantung pada asumsi browser semata.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- status/checklist tidak 500;
- renderer aman untuk blocked/ready/completed;
- run/reopen memakai contract aktual;
- timezone perusahaan menentukan default period;
- no regression in shell/navigation.
