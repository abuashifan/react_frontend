# Issue-01 — Permission Key Mismatch di Seluruh Aplikasi

**Tipe**: Bug  
**Severity**: Critical  
**Estimasi fix**: 1 sesi (semua perubahan di 10-15 file)  
**Referensi**: [gap-01-p0-contract-fixes.md](../gap_docs/gap-01-p0-contract-fixes.md)

---

## Deskripsi

Frontend menggunakan permission key yang tidak cocok dengan yang backend kirim di response `/auth/permissions`. Dampaknya:
- `PermissionGuard` menyembunyikan tombol yang seharusnya muncul
- `ProtectedRoute` memblokir halaman yang seharusnya bisa diakses
- Atau sebaliknya: menampilkan/membuka yang seharusnya dibatasi

---

## Daftar Fix per File

### `src/router/moduleConfig.ts`

```ts
// Ribbon items — ganti permission:

// Master Data ribbonItems: ganti semua dari 'master-data.view' ke:
{ id: 'chart-of-accounts', permission: 'coa.view' }
{ id: 'contacts',          permission: 'contacts.view' }
{ id: 'products',          permission: 'products.view' }
{ id: 'units',             permission: 'units.view' }
{ id: 'warehouses',        permission: 'warehouses.view' }
{ id: 'payment-terms',     permission: 'payment_terms.view' }
{ id: 'departments',       permission: 'departments.view' }
{ id: 'projects',          permission: 'projects.view' }
{ id: 'account-mappings',  permission: 'settings.company.view' }

// Accounting ribbonItems:
{ id: 'journals',      permission: 'journal.view' }
{ id: 'period-locks',  permission: 'fiscal_year.lock_manage' }
{ id: 'fiscal-years',  permission: 'fiscal_year.view' }
```

### `src/modules/master-data/routes.tsx`

Ganti semua `permission="master-data.view"` dengan permission per resource:
```ts
// COA routes → permission="coa.view"
// Contacts routes → permission="contacts.view"
// Products routes → permission="products.view"
// dll.
```

### `src/modules/master-data/pages/CoaListPage.tsx` dan `CoaFormPage.tsx`

```ts
// PermissionGuard untuk tombol create → 'coa.create'
// PermissionGuard untuk tombol edit → 'coa.edit'
// PermissionGuard untuk tombol deactivate → 'coa.deactivate'
```

### `src/modules/master-data/pages/KontakListPage.tsx` dan `KontakFormPage.tsx`

```ts
// Ganti semua 'master-data.*' → 'contacts.*'
```

### `src/modules/master-data/pages/ProdukListPage.tsx` dan `ProdukFormPage.tsx`

```ts
// Ganti semua 'master-data.*' → 'products.*'
```

### Semua halaman master-data lain (Satuan, Gudang, PaymentTerms, Departemen, Proyek)

```ts
// Satuan → 'units.*'
// Gudang → 'warehouses.*'
// PaymentTerms → 'payment_terms.*'
// Departemen → 'departments.*'
// Proyek → 'projects.*'
```

### `src/modules/sales/routes.tsx`

```ts
// Delivery Orders → 'sales.delivery_orders.view' (ganti dash ke underscore)
```

### `src/modules/sales/pages/DeliveryOrderListPage.tsx` dan `DeliveryOrderFormPage.tsx`

```ts
// 'sales.delivery-orders.*' → 'sales.delivery_orders.*'
```

### `src/modules/purchase/routes.tsx`

```ts
// Goods Receipts → 'purchase.goods_receipts.view'
```

### `src/modules/purchase/pages/GoodsReceiptListPage.tsx` dan `GoodsReceiptFormPage.tsx`

```ts
// 'purchase.goods-receipts.*' → 'purchase.goods_receipts.*'
```

### `src/modules/inventory/routes.tsx`

```ts
// Stock Opname → 'inventory.opname.view' (tanpa 's')
```

### `src/modules/inventory/pages/StockOpnameListPage.tsx` dan `StockOpnameFormPage.tsx`

```ts
// 'inventory.opnames.*' → 'inventory.opname.*'
```

### `src/modules/accounting/routes.tsx`

```ts
// Fiscal Years → 'fiscal_year.view'
// Period Locks → 'fiscal_year.lock_manage'
```

### `src/modules/accounting/pages/FiscalYearPage.tsx`

```ts
// PermissionGuard close → 'fiscal_year.close'
// PermissionGuard reopen → 'fiscal_year.reopen'
// PermissionGuard checklist → 'fiscal_year.closing_wizard'
```

### `src/modules/accounting/pages/PeriodLockPage.tsx`

```ts
// PermissionGuard → 'fiscal_year.lock_manage'
```

---

## Test Setelah Fix

1. Login sebagai user dengan role yang sudah dikonfigurasi
2. Cek `/auth/permissions` response — pastikan key-key di atas ada
3. Navigasi ke setiap module — ribbon items harus muncul sesuai permission
4. Cek tombol aksi (Tambah, Edit, Nonaktifkan) — hanya muncul untuk yang berhak
