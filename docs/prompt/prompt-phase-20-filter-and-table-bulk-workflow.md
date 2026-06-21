# Prompt — Phase 20: Filter and Table Bulk Workflow

**Phase**: 20  
**Referensi**: `spec-36-audit-12-ux-workflow-fixes.md`, `issue-18-transaction-list-filters.md`, `issue-19-datatable-selection-bulk-void.md`  
**Guardrails wajib**: `prompt-guardrails-audit-12-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-12-implementation.md
docs/issue_docs/issue-18-transaction-list-filters.md
docs/issue_docs/issue-19-datatable-selection-bulk-void.md
docs/design_docs/design-C1-datatable.md
docs/design_docs/design-C2-filter-sidebar.md
docs/praproduction_docs/spec-09-table-and-list.md
docs/praproduction_docs/spec-13-filter-and-search.md
src/components/shared/table/DataTable.tsx
src/components/shared/table/BulkActionBar.tsx
src/components/shared/layout/FilterSidebar.tsx
```

---

## 1. Tugas

1. Tentukan serializer multi-select per endpoint setelah verifikasi backend.
2. Buat helper reusable untuk checkbox multi-select/date range jika perlu.
3. Terapkan date range pada list transaksi yang endpoint-nya mendukung.
4. Tentukan policy row selection.
5. Tambahkan bulk void loop per id hanya untuk dokumen yang punya route void per-id.
6. Tampilkan partial failure summary.

---

## 2. Verification

```bash
npm run build
```

Manual:

- Checkbox filter bisa memilih lebih dari satu nilai.
- Date range mengubah query/data.
- Row checkbox muncul pada list dengan bulk action.
- Bulk void tidak memanggil endpoint fiktif.
