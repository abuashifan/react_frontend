# Prompt — Phase 18: Reports Contract Hardening

**Phase**: 18  
**Referensi**: `spec-36-audit-12-ux-workflow-fixes.md`, `issue-16-reports-runtime-contract.md`  
**Guardrails wajib**: `prompt-guardrails-audit-12-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-12-implementation.md
docs/issue_docs/issue-16-reports-runtime-contract.md
docs/praproduction_docs/spec-16-reports-module.md
docs/design_docs/design-I-reports.md
src/modules/reports/services/reportsApi.ts
src/modules/reports/types/reports.types.ts
src/modules/reports/pages/*
```

---

## 1. Tugas

1. Verifikasi route report backend aktual; perbaiki backend bila kontrak/reporting logic memang salah dan tambahkan feature test.
2. Buat/rapikan adapter report di service layer.
3. Tambahkan runtime guard di page report.
4. Hide/disable export buttons jika endpoint belum ada.
5. Hide/disable transaction report jika route belum ada.

---

## 2. Verification

```bash
npm run build
```

Manual:

- Trial Balance tidak crash.
- Profit Loss tidak crash.
- Balance Sheet tidak crash.
- Cash Flow tidak crash.
- Export tidak memanggil endpoint yang tidak tersedia.
