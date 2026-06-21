# Prompt — Phase 36: Financial and Operational Reports

**Phase**: 36  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-39-phase-36-financial-operational-reports.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-39-phase-36-financial-operational-reports.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/reports/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Reports yang relevan.

---

## 1. Tujuan Phase

Phase 36 memulihkan seluruh laporan finansial dan operasional, termasuk GL, TB, PL, BS, CF, financial summary, AR/AP aging/reconciliation, dan stock/inventory analysis reports.

---

## 2. Non-Negotiable Guardrails

- Jangan merender report shape lama tanpa adapter.
- Jangan menyembunyikan mismatch totals/sections dengan fallback palsu.
- Jangan mengubah filter period/date/as-of menjadi client-side only bila backend mendukung server-side.
- Jangan crash pada empty/error report response.

---

## 3. Tugas Utama

### Step 1 - Report adapters

Pastikan semua surface report memakai adapter canonical untuk totals, sections, and filter contract.

### Step 2 - Filter correctness

Pastikan period/date/as-of terkirim benar dan konsisten di seluruh surface.

### Step 3 - Export and unsupported behavior

Pastikan export atau route yang belum tersedia tidak ditampilkan sebagai feature nyata.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- report utama tidak crash;
- totals/sections canonical;
- filter benar;
- export hanya tampil jika endpoint nyata ada;
- no route/tab regression.
