# Prompt — Phase 31: AP Subledger and Reports

**Phase**: 31  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-34-phase-31-ap-subledger-reports.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-34-phase-31-ap-subledger-reports.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/purchase/ap/*
src/modules/reports/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Purchase/Reports yang relevan.

---

## 1. Tujuan Phase

Phase 31 memulihkan AP summary, aging, reconciliation, vendor ledger, dan bill ledger. Fokusnya adalah contract adapter dan cutoff/as-of yang benar.

---

## 2. Non-Negotiable Guardrails

- Jangan merender field report lama tanpa adapter.
- Jangan menyembunyikan mismatch bucket/total dengan fallback palsu.
- Jangan mengubah period/as-of filter menjadi client-side only jika backend mendukung server-side.
- Jangan crash pada empty/error response.

---

## 3. Tugas Utama

### Step 1 - Report adapters

Pastikan semua surface AP memakai adapter canonical untuk:

- buckets;
- totals;
- running balance;
- reconciliation mismatch;
- vendor/bill ledgers.

### Step 2 - Cutoff and filter

Pastikan:

- `as_of_date` dan range tanggal terkirim benar;
- cutoff konsisten antara summary dan detail;
- permission report benar;
- no hidden empty state when backend errors.

### Step 3 - Renderer safety

- totals dan mismatch harus jelas;
- no `NaN`/`Invalid Date`;
- no crash pada response shape valid atau kosong;
- state error harus bisa dibedakan.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- AP aging/reconciliation/vendor ledger/bill ledger render;
- totals sama dengan fixture backend;
- mismatch terlihat jelas;
- cutoff benar;
- no route/tab regression.
