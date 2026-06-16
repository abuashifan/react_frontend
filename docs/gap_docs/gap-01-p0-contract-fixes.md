# GAP-01 — P0 Contract Fixes

**Severity**: 🔴 Critical  
**Tipe**: Permission key salah, ribbon path salah, HTTP method salah  
**Tidak perlu modul baru** — hanya fix pada file yang sudah ada.

---

## 1. Permission Key Mismatch

Frontend menggunakan permission key yang tidak cocok dengan yang backend cek via `middleware('permission:...')`.

### Master Data

| Resource | Frontend pakai | Backend butuh |
|----------|---------------|---------------|
| COA | `master-data.view` | `coa.view` / `coa.create` / `coa.edit` / `coa.deactivate` |
| Contacts | `master-data.view` | `contacts.view` / `contacts.create` / `contacts.edit` / `contacts.deactivate` |
| Payment Terms | `master-data.view` | `payment_terms.view` / `payment_terms.create` / `payment_terms.edit` |
| Units | `master-data.view` | `units.view` / `units.create` / `units.edit` |
| Products | `master-data.view` | `products.view` / `products.create` / `products.edit` |
| Warehouses | `master-data.view` | `warehouses.view` / `warehouses.create` / `warehouses.edit` |
| Departments | `master-data.view` | `departments.view` / `departments.create` / `departments.edit` |
| Projects | `master-data.view` | `projects.view` / `projects.create` / `projects.edit` |
| Account Mappings | `master-data.view` | `settings.company.view` (untuk read), `settings.company.edit` (untuk update) |

### Sales

| Resource | Frontend pakai | Backend butuh |
|----------|---------------|---------------|
| Delivery Orders | `sales.delivery-orders.view` | `sales.delivery_orders.view` (underscore, bukan dash) |
| Delivery Orders create | `sales.delivery-orders.create` | `sales.delivery_orders.create` |
| Delivery Orders ship | `sales.delivery-orders.ship` | `sales.delivery_orders.ship` |
| Delivery Orders cancel | `sales.delivery-orders.cancel` | `sales.delivery_orders.cancel` |
| Delivery Orders void | `sales.delivery-orders.void` | `sales.delivery_orders.void` |

### Purchase

| Resource | Frontend pakai | Backend butuh |
|----------|---------------|---------------|
| Goods Receipts | `purchase.goods-receipts.view` | `purchase.goods_receipts.view` (underscore) |
| Goods Receipts create | `purchase.goods-receipts.create` | `purchase.goods_receipts.create` |
| Goods Receipts receive | `purchase.goods-receipts.receive` | `purchase.goods_receipts.receive` |

### Inventory

| Resource | Frontend pakai | Backend butuh |
|----------|---------------|---------------|
| Stock Opname view | `inventory.opnames.view` | `inventory.opname.view` (tanpa 's') |
| Stock Opname create | `inventory.opnames.create` | `inventory.opname.create` |
| Stock Opname edit | `inventory.opnames.edit` | `inventory.opname.edit` |
| Stock Opname finalize | `inventory.opnames.finalize` | `inventory.opname.finalize` |

### Accounting / Fiscal Year

| Resource | Frontend pakai | Backend butuh |
|----------|---------------|---------------|
| Fiscal Year view | `accounting.fiscal-years.manage` | `fiscal_year.view` |
| Fiscal Year close | `accounting.fiscal-years.manage` | `fiscal_year.close` |
| Fiscal Year reopen | `accounting.fiscal-years.manage` | `fiscal_year.reopen` |
| Fiscal Year closing wizard | `accounting.fiscal-years.manage` | `fiscal_year.closing_wizard` |
| Period Lock | `accounting.period-locks.manage` | `fiscal_year.lock_manage` |

### File yang perlu diubah

```
src/modules/master-data/routes.tsx
src/modules/master-data/pages/ (semua PermissionGuard di dalam page)
src/modules/sales/routes.tsx
src/modules/sales/pages/DeliveryOrderListPage.tsx
src/modules/sales/pages/DeliveryOrderFormPage.tsx
src/modules/purchase/routes.tsx
src/modules/purchase/pages/GoodsReceiptListPage.tsx
src/modules/purchase/pages/GoodsReceiptFormPage.tsx
src/modules/inventory/routes.tsx
src/modules/inventory/pages/StockOpnameListPage.tsx
src/modules/inventory/pages/StockOpnameFormPage.tsx
src/modules/accounting/routes.tsx
src/modules/accounting/pages/FiscalYearPage.tsx
src/modules/accounting/pages/PeriodLockPage.tsx
src/router/moduleConfig.ts (permission di ribbonItems)
```

---

## 2. Ribbon Path Mismatch

Klik ribbon item navigasi ke path salah → 404.

| Ribbon label | Path di ribbonItems (salah) | Route aktual di frontend |
|-------------|---------------------------|--------------------------|
| Akun (COA) | `/master-data/chart-of-accounts` | `/master-data/coa` |
| Transfer | `/cash-bank/transfers` | `/cash-bank/bank-transfers` |
| Rekonsiliasi | `/cash-bank/reconciliations` | `/cash-bank/bank-reconciliations` |

### File yang perlu diubah

```
src/router/moduleConfig.ts — 3 ribbonItems path
```

---

## 3. HTTP Method Mismatch

### Fiscal Year Closing

Backend menggunakan `GET` dan `POST`, bukan `PATCH`.

| Action | Frontend method (salah) | Backend method (benar) |
|--------|------------------------|------------------------|
| `/accounting/fiscal-years/{id}/closing-preview` | `PATCH` | `GET` |
| `/accounting/fiscal-years/{id}/closing-checklist` | `PATCH` | `GET` |
| `/accounting/fiscal-years/{id}/close` | `PATCH` | `POST` |
| `/accounting/fiscal-years/{id}/reopen` | `PATCH` | `POST` |

### Bank Reconciliation

| Action | Frontend method (salah) | Backend method (benar) |
|--------|------------------------|------------------------|
| `/cash-bank/bank-reconciliations/{id}/refresh-lines` | `PATCH` | `POST` |
| `/cash-bank/bank-reconciliations/{id}/mark-lines` | `PATCH` | `POST` |

### Bonus: Backend tidak punya endpoint ini

- `PATCH /cash-bank/bank-reconciliations/{id}/finalize` → **Tidak ada di backend**
  - Solusi: hapus tombol Finalize dari BankReconciliationFormPage, atau backend perlu tambah endpoint ini.
  - Status rekon di backend hanya bisa berubah lewat `mark-lines` (tidak ada finalize route).

### File yang perlu diubah

```
src/modules/accounting/services/fiscalYearApi.ts
src/modules/cash-bank/services/cashBankApi.ts
src/modules/cash-bank/hooks/useCashBankList.ts (hapus finalize mutation)
src/modules/cash-bank/pages/BankReconciliationFormPage.tsx (hapus tombol Finalize)
```
