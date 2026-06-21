# Issue-17 — Stock Balance Product DTO, Detail Route, and Unsupported Filters

**Tipe**: Inventory DTO adapter + route contract  
**Severity**: High  
**Sumber**: Audit-12 A12-05, A12-13, A12-14  
**Status**: Done

---

## Ringkasan

Stock Balance list membaca `product.code` dan `product.name`, sedangkan backend Product memakai `product_code` dan `product_name`. Detail frontend juga memanggil route kombinasi product+warehouse yang tidak ada di backend.

---

## Root Cause

- `StockBalanceListPage.tsx` membaca field product lama.
- Type relation product belum mencerminkan DTO Product canonical.
- Frontend detail route: `/inventory/stock-balances/:productId/:warehouseId`.
- Frontend API: `GET /inventory/stock-balances/{productId}/{warehouseId}`.
- Backend menyediakan:
  - `GET /inventory/stock-balances/product/{productId}`;
  - `GET /inventory/stock-balances/warehouse/{warehouseId}`;
  - list endpoint dengan filter tertentu.
- Frontend filter `search`, `product_category_id`, `stock_status` belum didukung backend list aktual.

---

## File Terkena

```text
src/modules/inventory/pages/StockBalanceListPage.tsx
src/modules/inventory/pages/StockBalanceDetailPage.tsx
src/modules/inventory/services/stockBalanceApi.ts
src/modules/inventory/types/stockBalance.types.ts
src/modules/inventory/hooks/useStockBalanceList.ts
src/modules/inventory/routes.tsx
```

---

## Prinsip Fix

- Adapter service harus expose product display fields yang stabil:
  - `product.code`;
  - `product.name`;
  - `product.description`.
- Detail tidak boleh memanggil endpoint fiktif.
- Jika detail kombinasi dibutuhkan sebelum backend route ada, ambil dari list endpoint dengan `product_id` + `warehouse_id` dan validasi row.
- Filter unsupported harus dihapus, disabled, atau diberi client-side label yang jelas.

---

## Acceptance Criteria

- List saldo stok menampilkan kode, nama, dan deskripsi produk jika backend mengirimnya.
- Klik detail tidak 404 karena route frontend memakai endpoint yang tersedia.
- Filter yang terlihat benar-benar memengaruhi data atau ditandai sebagai client-side/current-page.
- Build pass.

---

## Implementasi

- `stockBalanceApi` menormalkan response backend ke alias frontend `product.code`, `product.name`, `product.description`, dan `warehouse.code/name`.
- `StockBalanceListPage` menampilkan nama + deskripsi produk dan hanya mempertahankan filter gudang yang didukung backend.
- `StockBalanceDetailPage` mengambil data lewat endpoint list yang tersedia dengan filter `product_id` + `warehouse_id` dan menampilkan kode/deskripsi produk serta kode gudang.
- `npm run build` pass setelah perubahan.
