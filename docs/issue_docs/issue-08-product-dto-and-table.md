# Issue-08 — Product DTO and Table

**Tipe**: DTO mismatch + display bug  
**Severity**: Critical  
**Sumber**: Audit-11 A11-04, GAP-07  
**Status**: Belum selesai

---

## Ringkasan

Product adalah contoh paling terlihat dari mismatch Master Data. Table bisa menampilkan field kosong atau `NaN`, dan form create/update berisiko gagal 422 karena frontend memakai kontrak lama.

---

## Root Cause

Frontend saat ini memakai field seperti:

```text
code
name
category_id
sell_price
buy_price
coa_sales_id
coa_purchase_id
coa_inventory_id
```

Backend Product memakai field seperti:

```text
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

Backend product master saat audit tidak menyediakan `sell_price` dan `buy_price`. Parsing langsung seperti `Number(original.sell_price)` akan menghasilkan `NaN`.

---

## File Terkena

```text
src/modules/master-data/types/produk.types.ts
src/modules/master-data/schemas/produkSchema.ts
src/modules/master-data/services/produkApi.ts
src/modules/master-data/hooks/useProdukList.ts
src/modules/master-data/pages/ProdukListPage.tsx
src/modules/master-data/pages/ProdukFormPage.tsx
src/modules/master-data/services/kategoriProdukApi.ts
src/modules/master-data/services/satuanApi.ts
src/modules/master-data/services/coaApi.ts
```

Backend referensi read-only:

```text
/workspace/laravel_backend/app/Models/Tenant/Product.php
/workspace/laravel_backend/app/Http/Requests/MasterData/StoreProductRequest.php
/workspace/laravel_backend/app/Modules/MasterData/Routes/api.php
```

---

## Keputusan Bisnis yang Harus Dibuat

Sebelum implementasi, tentukan salah satu:

1. Harga jual/beli bukan bagian dari Product Master. Frontend hapus kolom dan field harga dari product master.
2. Harga jual/beli memang wajib. Backend harus menambah field/kontrak harga, lalu frontend mengikuti backend baru.

Rekomendasi audit: ikuti backend saat ini dulu dan hapus harga dari Product Master UI agar table/form tidak memberi janji palsu.

---

## Acceptance Criteria

- Product list menampilkan kode, nama, tipe, kategori, satuan, dan status dari field backend yang benar.
- Tidak ada `NaN` pada Product list.
- Form create/update mengirim `product_name`, `product_type`, `product_category_id`, `unit_id`, dan account fields sesuai backend.
- Filter kategori memakai `product_category_id` atau adapter yang jelas.
- Jika relation category/unit belum di-eager-load backend, frontend punya fallback label yang jujur dan tidak kosong membingungkan.
- Build sukses setelah implementasi.
