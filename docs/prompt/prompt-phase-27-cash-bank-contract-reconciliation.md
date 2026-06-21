# Prompt — Phase 27: Cash and Bank Contract and Reconciliation

**Phase**: 27  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-30-phase-27-cash-bank-contract-reconciliation.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-30-phase-27-cash-bank-contract-reconciliation.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/cash-bank/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Cash & Bank yang relevan.

---

## 1. Tujuan Phase

Phase 27 menstabilkan receipt, payment, transfer, dan reconciliation:

- request/response adapter canonical;
- account selector valid;
- cutoff and same-account rules;
- post/void lifecycle;
- reconciliation opening/ending/cleared/difference.

---

## 2. Non-Negotiable Guardrails

- Jangan mengirim transfer ke akun yang sama.
- Jangan menyamakan refresh/mark lines dengan reset state diam-diam.
- Jangan membiarkan post/void/reconcile tanpa lifecycle yang jelas.
- Jangan membuat UI reconciliation terlihat benar saat data contract salah.
- Jangan ubah shell/router behavior yang tidak berkaitan.

---

## 3. Tugas Utama

### Step 1 - Per resource adapter

Periksa receipt, payment, transfer, dan reconciliation. Setiap resource harus punya request/response adapter yang jelas.

### Step 2 - Validation rules

Pastikan:

- account selector valid;
- same-account transfer ditolak;
- cutoff date valid;
- cleared state tidak hilang tanpa explicit action.

### Step 3 - Lifecycle and tracing

Pastikan post/void/reconcile:

- mengikuti permission;
- menampilkan state yang benar;
- menghasilkan journal effect yang traceable;
- tidak crash pada error backend.

### Step 4 - UI feedback

- tampilkan opening/ending/cleared/difference dengan jelas;
- state empty/loading/error harus dibedakan;
- double submit dicegah;
- confirmation yang sensitif harus eksplisit.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- create/detail/post/void lulus;
- same-account transfer tidak bisa disubmit;
- reconciliation values benar;
- refresh/mark lines tidak menghapus state diam-diam;
- no regression pada tab/ribbon/navigation.
