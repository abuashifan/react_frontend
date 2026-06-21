# Prompt — Phase 32: Inventory Integrity and Workflow

**Phase**: 32  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-35-phase-32-inventory-integrity-workflow.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-35-phase-32-inventory-integrity-workflow.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/inventory/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Inventory yang relevan.

---

## 1. Tujuan Phase

Phase 32 menstabilkan stock balance, movement, adjustment, opname, dan negative stock behavior.

---

## 2. Non-Negotiable Guardrails

- Jangan menyembunyikan negative stock policy dengan fallback angka.
- Jangan membiarkan movement/source contract kabur.
- Jangan mengabaikan cutoff/as-of saat render stock/report.
- Jangan crash pada stock detail/adjustment/opname flow.

---

## 3. Tugas Utama

### Step 1 - Stock adapters

Pastikan stock balance/detail/movement memakai adapter canonical.

### Step 2 - Workflow contract

Pastikan adjustment dan opname:

- mengikuti permission;
- menghormati lifecycle;
- memakai source dan cutoff yang benar;
- menghasilkan data traceable.

### Step 3 - Negative stock and filter

- tampilkan policy negatif secara jelas;
- filter dan as-of harus terkirim benar;
- no fake totals/labels.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- product/stock balance/detail tidak crash;
- movement/adjustment/opname canonical;
- negative stock policy jelas;
- cutoff benar;
- no regression in shell/navigation.
