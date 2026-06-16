# GAP-07 — Master Data DTO & Action Contract Mismatch

**Severity**: 🔴 Critical  
**Tipe**: DTO field mismatch, form payload mismatch, list display mismatch, action mismatch  
**Sumber utama**: `../audit_docs/audit-11-frontend-global-contract-map-16-06-26.md` A11-02, A11-03, A11-04  
**Scope**: Master Data only. Jangan gabungkan dengan Sales/Purchase/Inventory document DTO.

---

## 1. Ringkasan

Frontend Master Data masih memakai kontrak field lama/mock, sementara backend Laravel sudah memakai field domain aktual. Akibatnya list bisa tampak kosong, form bisa gagal 422, dan beberapa angka tampil `NaN`.

Gap ini **berbeda** dari GAP-01:

- GAP-01 membahas permission, ribbon path, dan HTTP method.
- GAP-07 membahas field name, payload shape, relation display, filter params, dan action semantics.

---

## 2. Resource yang Terkena

| Resource | Status | Gejala utama |
|---|---|---|
| COA | Broken setelah route terbuka | Field `code/name/type/parent_id` tidak cocok dengan backend `account_*`. |
| Contacts | Broken/partial | Frontend pakai `code/type/npwp`, backend pakai `contact_code/contact_type/tax_number`. |
| Products | Broken visible | Table kosong/`NaN`, form payload tidak sesuai backend. |
| Units | Broken on form | Frontend pakai `symbol/decimal_places`, backend wajib `code/precision`. |
| Warehouses | Broken on create/update | Backend wajib `code`, frontend payload tidak punya `code`. |
| Payment Terms | Broken on create/update | Backend wajib `code`, frontend payload tidak punya `code`. |
| Product Categories | Partial mismatch | Frontend punya `description/product_count`, backend punya `parent_category_id/is_active`. |
| Departments/Projects | Perlu verifikasi | Frontend perlu dicek terhadap backend model/request sebelum dianggap aman. |
| Account Mappings | Relatif benar | Endpoint sudah `/master-data/account-mappings`, tetap perlu cek selected account label. |

---

## 3. DTO Mismatch Detail

### 3.1 COA

Frontend:

```ts
code
name
type
parent_id
parent
```

Backend:

```php
account_code
account_name
account_type
parent_account_id
parent
normal_balance
is_cash_bank
```

Dampak:

- COA list tree tidak bisa build parent-child dengan benar jika tetap pakai `parent_id`.
- COA form create/update mengirim `code/name/type`, backend request butuh `account_code/account_name/account_type`.
- Search option bisa label kosong jika `coaApi.search()` membaca `a.name/a.code`.

---

### 3.2 Contacts

Frontend:

```ts
code
type
npwp
payment_term
```

Backend:

```php
contact_code
contact_type
tax_number
paymentTerm
is_customer
is_supplier
is_employee
```

Dampak:

- Filter frontend `type` tidak cocok dengan backend filter `contact_type`.
- List code/type bisa kosong.
- Payload `npwp` tidak dipakai backend; backend butuh `tax_number`.

---

### 3.3 Products

Frontend:

```ts
code
name
category_id
sell_price
buy_price
coa_sales_id
coa_purchase_id
coa_inventory_id
```

Backend:

```php
product_code
product_name
product_type
product_category_id
unit_id
sales_account_id
purchase_account_id
inventory_account_id
cogs_account_id
```

Dampak:

- `Number(original.sell_price)` menghasilkan `NaN` karena backend tidak punya `sell_price`.
- Form tidak mengirim `product_name`, sehingga create/update gagal validasi.
- Filter `category_id` tidak sesuai backend `product_category_id`.
- Account fields memakai nama lama `coa_*`, backend memakai `*_account_id`.

Keputusan bisnis yang perlu dibuat:

- Apakah harga jual/beli memang tidak ada di product master?
- Jika harga diperlukan, backend harus menambah field/endpoint price. Jika tidak, frontend harus hapus section harga dari Product form/list.

---

### 3.4 Units

Frontend:

```ts
symbol
decimal_places
```

Backend:

```php
code
precision
```

Dampak:

- Create unit gagal karena `code` dan `precision` wajib.
- Product form relation `unit.symbol` tidak selalu ada.

---

### 3.5 Warehouses

Frontend payload tidak mengirim `code`. Backend request mewajibkan:

```php
code
name
address
is_default
is_active
```

Dampak:

- Create warehouse gagal 422.
- UI tidak punya field default warehouse (`is_default`) walaupun backend mendukung.

---

### 3.6 Payment Terms

Frontend payload tidak mengirim `code`. Backend request mewajibkan:

```php
code
name
days
is_custom
is_active
sort_order
```

Dampak:

- Create payment term gagal 422.
- UI tidak merepresentasikan `is_custom` dan `sort_order`.

---

### 3.7 Product Categories

Frontend:

```ts
description
product_count
```

Backend:

```php
name
parent_category_id
is_active
```

Dampak:

- Field `description/product_count` bisa kosong karena bukan field model utama.
- Category tree/parent belum direpresentasikan di UI.

---

## 4. Action Mismatch: Delete vs Activate/Deactivate

Frontend simple master services memakai `DELETE` untuk:

```text
kategoriProdukApi.delete
satuanApi.delete
gudangApi.delete
paymentTermsApi.delete
departemenApi.delete
proyekApi.delete
```

Backend Master Data tidak menyediakan delete route. Backend memakai:

```text
PATCH /{resource}/{id}/deactivate
PATCH /{resource}/{id}/activate
```

Dampak:

- Tombol hapus akan gagal 404/405.
- Permission guard `*.delete` tidak cocok dengan backend permission seperti `units.deactivate`, `warehouses.deactivate`, dll.

Prinsip fix:

- Ubah wording UI dari "Hapus" menjadi "Nonaktifkan".
- Tambahkan aksi "Aktifkan" jika item inactive.
- Jangan hard delete Master Data dari frontend.

---

## 5. Opsi Strategi Fix

### Opsi A — Frontend mengikuti backend field langsung

Frontend types, schema, form, dan list diganti ke field backend (`account_code`, `product_name`, dst).

Kelebihan:

- Kontrak paling transparan.
- Minim adapter.

Kekurangan:

- Banyak page harus berubah.
- UI code jadi lebih backend-flavored.

### Opsi B — Adapter per service

Service mengubah backend DTO menjadi UI DTO, lalu submit mengubah UI payload ke backend payload.

Kelebihan:

- UI tetap pakai istilah ringkas.
- Perubahan terisolasi di service/adapter.

Kekurangan:

- Harus disiplin; jangan normalisasi diam-diam di `http.ts`.
- Type backend dan type UI perlu dipisah jelas.

Rekomendasi:

- Untuk Master Data, gunakan adapter per service agar UI tetap stabil.
- Hindari menambah alias besar di `http.ts` untuk field Master Data.

---

## 6. File Area yang Akan Terkena

```text
src/modules/master-data/types/*.types.ts
src/modules/master-data/schemas/*.ts
src/modules/master-data/services/*Api.ts
src/modules/master-data/hooks/*.ts
src/modules/master-data/pages/*Page.tsx
src/modules/master-data/routes.tsx
src/hooks/usePermission.ts
src/router/moduleConfig.ts
```

Backend reference read-only:

```text
/workspace/laravel_backend/app/Modules/MasterData/Routes/api.php
/workspace/laravel_backend/app/Http/Requests/MasterData/*
/workspace/laravel_backend/app/Models/Tenant/ChartOfAccount.php
/workspace/laravel_backend/app/Models/Tenant/Contact.php
/workspace/laravel_backend/app/Models/Tenant/Product.php
/workspace/laravel_backend/app/Models/Tenant/Unit.php
/workspace/laravel_backend/app/Models/Tenant/Warehouse.php
/workspace/laravel_backend/app/Models/Tenant/PaymentTerm.php
/workspace/laravel_backend/app/Models/Tenant/ProductCategory.php
```

---

## 7. Jangan Dikerjakan di Gap Ini

- Jangan refactor Sales/Purchase/Inventory transaction DTO di GAP-07.
- Jangan membuat module baru.
- Jangan mengubah backend.
- Jangan merapikan desain table besar-besaran sebelum DTO/API stabil.

---

## 8. Dokumen Lanjutan

Detail issue yang sudah tersedia:

```text
issue_docs/issue-08-product-dto-and-table.md
issue_docs/issue-09-master-data-delete-actions.md
```

Spec implementasi sudah tersedia:

```text
praproduction_docs/spec-32-master-data-dto-contract-fixes.md
```

Prompt implementasi sudah tersedia:

```text
prompt/prompt-phase-14-master-data-dto-contract-fixes.md
```

Jika COA/Contact/Unit perlu detail terpisah, tambahkan issue baru per resource.
