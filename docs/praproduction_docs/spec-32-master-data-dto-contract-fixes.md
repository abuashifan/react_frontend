# Spec-32 — Master Data DTO & Action Contract Fixes

**Phase**: 14  
**Tipe**: Refactor kontrak API + bug fixes  
**Severity**: Critical  
**Referensi**: Audit-11 A11-02, A11-03, A11-04; GAP-07; issue-08; issue-09  
**Scope**: Master Data only.

---

## 1. Tujuan

Menyelaraskan seluruh Master Data frontend dengan kontrak backend Laravel aktual:

- field response list/detail;
- payload create/update;
- filter params;
- SearchableSelect option label;
- permission key;
- action activate/deactivate.

Spec ini tidak membahas transaksi Sales/Purchase/Inventory. Nomor dokumen transaksi ada di `spec-33`.

---

## 2. Prinsip Implementasi

1. Backend Laravel adalah source of truth.
2. Jangan menambah business DTO alias baru di `src/services/http.ts`.
3. Gunakan adapter per service jika UI ingin tetap memakai nama field ringkas.
4. Pisahkan type backend dan type UI jika field name berbeda signifikan.
5. Form tetap memakai React Hook Form + Zod.
6. Semua API call tetap di `src/modules/master-data/services/`.
7. Semua angka di table memakai formatter shared dan `tabular-nums`.
8. Jangan hard delete Master Data; gunakan activate/deactivate.

---

## 3. Backend Route Canonical

Semua route berada di prefix:

```text
/master-data
```

Resource canonical:

```text
GET/PATCH/POST /chart-of-accounts
GET/PATCH/POST /contacts
GET/PATCH/POST /payment-terms
GET/PATCH/POST /units
GET/PATCH/POST /product-categories
GET/PATCH/POST /products
GET/PATCH/POST /warehouses
GET/PATCH/POST /departments
GET/PATCH/POST /projects
GET       /account-mappings
PATCH     /account-mappings/{mappingKey}
```

Untuk resource selain account mappings, action status:

```text
PATCH /{resource}/{id}/deactivate
PATCH /{resource}/{id}/activate
```

Tidak ada `DELETE` untuk resource Master Data di route backend saat audit.

---

## 4. Field Contract per Resource

### 4.1 Chart of Accounts

Backend fields utama:

```text
account_code
account_name
account_type
parent_account_id
normal_balance
is_cash_bank
is_active
parent
```

Frontend field lama `code`, `name`, `type`, dan `parent_id` hanya boleh dipakai sebagai UI DTO internal jika diterjemahkan di service adapter.

Search label:

```text
{account_code} - {account_name}
```

### 4.2 Contacts

Backend fields utama:

```text
contact_code
contact_type
name
email
phone
address
tax_number
payment_term_id
is_customer
is_supplier
is_employee
is_active
```

Mapping lama:

```text
code -> contact_code
type -> contact_type
npwp -> tax_number
```

### 4.3 Products

Backend model/request fields utama:

```text
product_code
product_name
product_type
product_category_id
unit_id
is_stock_item
is_active
description
sales_account_id
purchase_account_id
inventory_account_id
cogs_account_id
```

Validasi penting:

- `product_name` wajib saat create.
- `unit_id` wajib jika `is_stock_item = true`.
- `service` dan `fixed_asset` tidak boleh menjadi stock item.
- `sales_account_id` harus account type `revenue`.
- `purchase_account_id` dan `cogs_account_id` harus account type `expense`.
- `inventory_account_id` harus account type `asset`.

Field yang tidak ada di backend Product saat audit:

```text
sell_price
buy_price
```

Keputusan spec:

- Hilangkan harga jual/beli dari Product Master UI untuk phase ini.
- Jangan tampilkan kolom harga.
- Jangan mengirim harga di payload.
- Jika harga dibutuhkan bisnis, buat backend contract baru di phase terpisah.

### 4.4 Units

Backend fields:

```text
code
name
precision
is_active
```

Mapping lama:

```text
symbol -> code
decimal_places -> precision
```

### 4.5 Warehouses

Backend fields:

```text
code
name
address
is_default
is_active
```

Frontend form wajib menyediakan atau membuat `code`.

### 4.6 Payment Terms

Backend fields:

```text
code
name
days
is_custom
is_active
sort_order
```

Frontend form wajib menyediakan atau membuat `code`.

### 4.7 Product Categories

Backend fields:

```text
name
parent_category_id
is_active
```

Frontend field lama `description` dan `product_count` tidak boleh dianggap wajib dari backend.

### 4.8 Departments and Projects

Backend routes menyediakan activate/deactivate. Sebelum implementasi detail, cek model/request backend aktual untuk field wajib.

---

## 5. Service Adapter Pattern

Rekomendasi: adapter per service.

```ts
interface ProductBackendDto {
  id: number
  product_code: string | null
  product_name: string
  product_type: 'goods' | 'service' | 'non_inventory' | 'fixed_asset'
  product_category_id?: number | null
  unit_id?: number | null
  is_stock_item: boolean
  is_active: boolean
}

interface ProductUiDto {
  id: number
  code: string
  name: string
  type: ProductBackendDto['product_type']
  categoryId?: number | null
  unitId?: number | null
  isStockItem: boolean
  isActive: boolean
}

function toProductUi(row: ProductBackendDto): ProductUiDto {
  return {
    id: row.id,
    code: row.product_code ?? '',
    name: row.product_name,
    type: row.product_type,
    categoryId: row.product_category_id ?? null,
    unitId: row.unit_id ?? null,
    isStockItem: row.is_stock_item,
    isActive: row.is_active,
  }
}
```

---

## 6. Activate/Deactivate Pattern

Setiap simple master service yang saat ini punya `delete` harus diganti:

```ts
deactivate: (id: number) =>
  http.patch(`/master-data/{resource}/${id}/deactivate`)

activate: (id: number) =>
  http.patch(`/master-data/{resource}/${id}/activate`)
```

UI copy:

```text
Hapus -> Nonaktifkan
Pulihkan -> Aktifkan
```

Dialog harus menjelaskan bahwa data historis tidak dihapus.

---

## 7. Permission Mapping

Ikuti route middleware backend:

```text
coa.view / coa.create / coa.edit / coa.deactivate
contacts.view / contacts.create / contacts.edit / contacts.deactivate
payment_terms.view / payment_terms.create / payment_terms.edit / payment_terms.deactivate
units.view / units.create / units.edit / units.deactivate
products.view / products.create / products.edit / products.deactivate
warehouses.view / warehouses.create / warehouses.edit / warehouses.deactivate
departments.view / departments.create / departments.edit / departments.deactivate
projects.view / projects.create / projects.edit / projects.deactivate
settings.company.view / settings.company.edit untuk account mappings
```

Jangan pakai permission lama seperti `master-data.view` untuk tombol aksi resource-specific.

---

## 8. File Area

```text
src/modules/master-data/types/*.types.ts
src/modules/master-data/schemas/*.ts
src/modules/master-data/services/*Api.ts
src/modules/master-data/hooks/*.ts
src/modules/master-data/pages/*Page.tsx
src/modules/master-data/routes.tsx
src/router/moduleConfig.ts
src/hooks/usePermission.ts
src/lib/utils.ts
```

Backend reference read-only:

```text
/workspace/laravel_backend/app/Modules/MasterData/Routes/api.php
/workspace/laravel_backend/app/Http/Requests/MasterData/*
/workspace/laravel_backend/app/Models/Tenant/*
```

---

## 9. Implementation Order

1. Fix service/type/schema for COA.
2. Fix Product list/form completely.
3. Fix Units, Warehouses, Payment Terms.
4. Fix Contacts and Product Categories.
5. Replace delete actions with activate/deactivate.
6. Fix Departments/Projects after checking backend request fields.
7. Re-check SearchableSelect labels for all Master Data pickers.
8. Run build.

---

## 10. Acceptance Criteria

- COA, Contact, Product, Unit, Warehouse, Payment Term, Product Category list display non-empty fields when backend returns data.
- Product table never shows `NaN`.
- Product form validates stock item/unit rule before submit.
- No Master Data resource calls `DELETE` unless backend later adds a route explicitly.
- Action buttons are permission guarded with backend permission keys.
- Service types match actual response/payload shape or have explicit adapter types.
- `npm run build` succeeds.
