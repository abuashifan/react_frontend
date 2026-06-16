# Issue-15 — DataTable Reuse and Sticky Column Audit

**Tipe**: Shared component consistency + responsive table  
**Severity**: Medium  
**Sumber**: Audit-11 A11-18, design-C1, design-C4  
**Status**: Belum selesai

---

## Ringkasan

Frontend sudah punya reusable `DataTable`, tetapi pemakaian belum konsisten. COA masih memakai custom table, beberapa sticky offset manual berisiko overlap, dan selection checkbox bisa muncul tanpa bulk action yang jelas.

---

## Root Cause

- Table dibuat bertahap per module sehingga pola lama dan baru bercampur.
- Sticky column memakai angka manual seperti `0` atau `32`.
- `onRowSelect` otomatis menambah checkbox selection, walaupun tidak semua halaman punya action bulk.
- DTO mismatch membuat table bug terlihat seperti bug komponen, padahal sebagian berasal dari mapping data.

---

## File Terkena

```text
src/components/shared/table/DataTable.tsx
src/components/shared/table/TablePagination.tsx
src/components/shared/table/BulkActionBar.tsx
src/modules/master-data/pages/CoaListPage.tsx
src/modules/**/pages/*ListPage.tsx
```

Design reference:

```text
docs/design_docs/design-C1-datatable.md
docs/design_docs/design-C4-tablet-datatable-viewport.md
docs/praproduction_docs/spec-09-table-and-list.md
docs/praproduction_docs/spec-23-tablet-first-layout-rules.md
```

---

## Prinsip Fix

- Selesaikan DTO/API mapping lebih dulu agar table menerima data benar.
- Setelah itu, audit semua list page yang tidak memakai `DataTable`.
- Sticky behavior harus konsisten pada tablet viewport.
- Selection checkbox hanya muncul jika ada kebutuhan bulk action yang nyata.
- Jangan merombak visual besar sebelum kontrak data stabil.

---

## Acceptance Criteria

- Semua workspace list memakai pola table yang konsisten atau punya alasan tertulis jika custom.
- Tidak ada sticky column overlap pada viewport tablet.
- Pagination, empty state, loading state, dan error state konsisten.
- Checkbox selection tidak muncul tanpa bulk action.
- Build sukses setelah implementasi.
