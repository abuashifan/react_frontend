# Prompt — Phase 22: Select, Date, and Edit Mode UX

**Phase**: 22  
**Referensi**: `spec-36-audit-12-ux-workflow-fixes.md`, issue-21, issue-22, issue-25  
**Guardrails wajib**: `prompt-guardrails-audit-12-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-12-implementation.md
docs/issue_docs/issue-21-searchable-select-preload.md
docs/issue_docs/issue-22-date-input-normalization.md
docs/issue_docs/issue-25-document-edit-mode-policy.md
docs/design_docs/design-C3-searchable-select.md
docs/praproduction_docs/spec-08-form-architecture.md
docs/praproduction_docs/spec-10-document-workflow.md
src/components/shared/form/SearchableSelect.tsx
src/lib/utils.ts
src/components/shared/document/DocumentActionBar.tsx
src/components/shared/document/DocumentLockedBanner.tsx
```

---

## 1. Tugas

1. SearchableSelect melakukan preload opsi awal saat open jika service mendukung.
2. Audit selectedOptions form prioritas: journal, cash-bank, sales, purchase.
3. Tambahkan `toDateInputValue`.
4. Terapkan helper ke reset/default edit tanggal.
5. Dokumentasikan policy edit/read-only dalam UI form yang disentuh.

---

## 2. Verification

```bash
npm run build
```

Manual:

- Dropdown akun/customer/product usable saat dibuka.
- Label edit tidak hilang.
- Date input edit menampilkan `YYYY-MM-DD`.
- Dokumen read-only menampilkan alasan.
