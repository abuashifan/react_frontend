# Issue-18 — Transaction List Multi-Select Filters and Date Range

**Tipe**: Filter UX + query serialization  
**Severity**: High  
**Sumber**: Audit-12 A12-01, A12-02  
**Status**: Done

---

## Ringkasan

Banyak list transaksi memakai checkbox filter, tetapi state hanya menyimpan satu nilai. Date range juga belum tersedia merata di cash-bank, sales, purchase, dan inventory transaction list.

---

## Root Cause

Pattern lama:

```text
checked={filterStatus === status}
onCheckedChange={(checked) => setFilterStatus(checked ? status : undefined)}
```

Akibatnya UI checkbox terlihat multi-select, tetapi perilakunya single-select.

---

## File Terkena

```text
src/modules/cash-bank/pages/*ListPage.tsx
src/modules/sales/pages/*ListPage.tsx
src/modules/purchase/pages/*ListPage.tsx
src/modules/inventory/pages/StockMovementListPage.tsx
src/modules/inventory/pages/StockAdjustmentListPage.tsx
src/modules/inventory/pages/StockOpnameListPage.tsx
src/components/shared/layout/FilterSidebar.tsx
```

Calon helper:

```text
src/components/shared/filter/MultiCheckboxFilter.tsx
src/components/shared/filter/DateRangeFilterSection.tsx
src/hooks/useFilterQueryState.ts
```

---

## Prinsip Fix

- Multi-select state memakai array.
- Serializer query harus diputuskan per backend:
  - repeated params: `status[]=draft&status[]=posted`;
  - comma params: `status=draft,posted`;
  - fallback client-side hanya jika backend belum support dan harus diberi catatan.
- Date range memakai `date_from` dan `date_to` hanya setelah route/controller diverifikasi.
- Reset filter harus menghapus array dan date range sekaligus.

---

## Acceptance Criteria

- User bisa memilih lebih dari satu status/type pada filter checkbox.
- Date range tersedia di list transaksi yang didukung endpoint.
- Query params tidak memecah pagination/search.
- Tidak ada filter visual yang diam-diam tidak bekerja tanpa label/fallback.
- Build pass.

---

## Implementasi

- Multi-select status/type sudah memakai array state dan helper reusable `MultiCheckboxFilter`.
- Date range memakai `DateRangeFilterSection` dengan quick preset.
- Pada list yang backend-nya belum mendukung serializer multi-value/date range, filter dijalankan sebagai fallback client-side pada data halaman yang sedang dimuat dan diberi hint eksplisit di sidebar.
- Page yang sudah ikut rollout: Sales Invoice, Sales Receipt, Sales Return, Cash Receipt, Cash Payment, Bank Transfer, Vendor Bill, Vendor Payment, Vendor Deposit, Goods Receipt, Stock Movement, Stock Adjustment, dan Stock Opname.
