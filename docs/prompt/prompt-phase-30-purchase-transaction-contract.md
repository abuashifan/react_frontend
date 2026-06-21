# Prompt — Phase 30: Purchase Transaction Contract

**Phase**: 30  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-33-phase-30-purchase-transaction-contract.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-33-phase-30-purchase-transaction-contract.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/purchase/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Purchase yang relevan.

---

## 1. Tujuan Phase

Phase 30 memperbaiki kontrak transaksi Purchase secara menyeluruh:

- purchase request;
- purchase order;
- goods receipt;
- vendor bill;
- payment;
- deposit;
- return.

---

## 2. Non-Negotiable Guardrails

- Jangan membiarkan payload form bergantung pada field legacy yang sudah salah.
- Jangan menutup source conversion error dengan fallback palsu.
- Jangan membiarkan return melewati accounting/inventory control.
- Jangan menghapus draft persistence jika phase membutuhkan itu untuk UX.
- Jangan ubah global router/tab architecture.

---

## 3. Tugas Utama

### Step 1 - Resource adapter

Setiap resource purchase harus punya adapter request/response yang konsisten.

### Step 2 - Source and line rules

Pastikan:

- source picker valid;
- remaining quantity/amount jelas;
- return tidak over-convert;
- line validation canonical;
- lifecycle action sesuai permission.

### Step 3 - Draft and detail behavior

- draft create form tetap tersimpan;
- detail round-trip sama dengan backend;
- error/not-found/permission state jelas;
- no fake data for missing contract.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- representative create/detail/edit screens work;
- source picker and remaining amount visible;
- draft persistence intact;
- return flow obeys control;
- no regression in shell/navigation.
