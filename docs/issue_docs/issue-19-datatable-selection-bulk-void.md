# Issue-19 — DataTable Row Selection and Bulk Void Workflow

**Tipe**: Table selection + document workflow  
**Severity**: High  
**Sumber**: Audit-12 A12-06, A12-07  
**Status**: Done

---

## Ringkasan

Checkbox row selection tidak muncul di transaction list karena page tidak mengirim `selectedRows`, `onRowSelect`, atau `bulkActions`. Bulk void juga belum tersedia, sementara backend hanya punya endpoint void per dokumen.

---

## Root Cause

- `DataTable` hanya inject checkbox jika selection dan bulk actions tersedia.
- List transaksi belum punya state selected rows.
- Backend belum menyediakan endpoint batch/bulk void.

---

## File Terkena

```text
src/components/shared/table/DataTable.tsx
src/components/shared/table/BulkActionBar.tsx
src/components/shared/document/VoidConfirmDialog.tsx
src/modules/cash-bank/pages/*ListPage.tsx
src/modules/sales/pages/*ListPage.tsx
src/modules/purchase/pages/*ListPage.tsx
src/modules/inventory/pages/*ListPage.tsx
src/modules/*/services/*Api.ts
```

---

## Prinsip Fix

- Tentukan policy global sebelum implement:
  - checkbox muncul hanya jika ada bulk action;
  - atau checkbox bisa muncul dengan prop `selectable`, tetapi action menyusul.
- Untuk bulk void tanpa endpoint backend, opsi frontend adalah loop per selected id:
  - gunakan void endpoint per dokumen;
  - tampilkan progress;
  - rangkum partial failure;
  - invalidasi query setelah selesai.
- Tetap gunakan `VoidConfirmDialog` dan reason satu kali.
- Permission guard wajib untuk bulk void action.

---

## Acceptance Criteria

- Transaction list yang punya void route dapat menampilkan row checkbox dan bulk void.
- Bulk void tidak memanggil endpoint fiktif.
- Partial failure ditampilkan jelas.
- Selection clear setelah sukses atau user cancel.
- Build pass.

---

## Implementasi

- `DataTable` tetap menjadi sumber checkbox row selection, dan halaman list sekarang mengirim `selectedRows`, `onRowSelect`, serta `bulkActions`.
- Bulk void menggunakan loop per dokumen dengan `Promise.allSettled`, lalu merangkum hasil sukses/gagal melalui toast.
- Konfirmasi tetap memakai `VoidConfirmDialog` dengan label tunggal atau plural sesuai jumlah dokumen terpilih.
- Page yang sudah ikut rollout: Sales Invoice, Sales Receipt, Sales Return, Cash Receipt, Cash Payment, Bank Transfer, Vendor Bill, Vendor Payment, Vendor Deposit, Goods Receipt, Stock Movement, Stock Adjustment, dan Stock Opname.
