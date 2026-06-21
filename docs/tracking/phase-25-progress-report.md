# Phase 25 Progress Report

Tanggal: 2026-06-21  
Status: In Progress  
Scope implemented: account mapping, COA, contact, product, department, project, payment term

## Masalah yang Ditutup di Kode

- DTO frontend membaca `key`, sementara backend mengirim `mapping_key`.
- Label akun existing diabaikan sehingga selector menampilkan `ID`.
- Semua mapping, termasuk hidden mapping, dirender flat tanpa metadata section/required/type.
- Save mengirim seluruh mapping satu per satu dan dapat menghasilkan partial update.
- Required mapping dapat dikosongkan.
- Search akun menawarkan akun nonaktif atau tipe yang tidak sesuai.
- Load error dianggap empty dan save error tidak informatif.
- Selector tidak memiliki accessible name unik.
- HTTP client dapat membentuk base URL dengan literal `undefined` pada environment tanpa `VITE_API_BASE_URL`.

## Solusi

- Tambah shared `AccountMappingEditor` untuk route Master Data dan Settings.
- Canonical type menggunakan `mapping_key` dan metadata response backend.
- Preload label `account_name` + `account_code`.
- Render hanya `visible_in_settings`, urut dan kelompok per section.
- Dirty tracking dan single atomic bulk PATCH.
- Backend melakukan pre-validation required/active/account type sebelum transaction.
- COA search mendukung filter multi account type dan active state.
- Tambah error/retry state serta accessible selector label.

## Verification

```text
Frontend build: pass
Frontend lint: 0 error, 34 warning legacy
Playwright Phase 25 master-data route-mock: 3/3 pass
Backend AccountMappingTest: 3/3 pass
Backend ChartOfAccountTest: 7/7 pass
Backend full MasterData feature scope: 31/31 pass
Pint scoped: pass
```

## Remaining

Status item per 2026-06-21 (update lanjutan):

- Default payment-term policy — **selesai**. `PaymentTermsPage` menulis
  `default_payment_term_id` ke company `transaction_defaults`, dengan badge Default,
  guard `settings.company.edit`, dan disable saat item nonaktif. E2E route-mock
  membuktikan request default terkirim.
- Bulk lifecycle simple masters — **selesai**. Satuan, Kategori Produk, Gudang,
  Payment Term, Departemen, dan Proyek kini memakai row-selection + `BulkActionBar`
  (activate/deactivate) lewat `DataTable`, pola identik COA. E2E bulk deactivate unit
  membuktikan tiap baris terpilih memanggil endpoint deactivate.
- Keputusan modal-vs-form-page — **diputuskan**: simple master (field sedikit) memakai
  `Dialog`; complex master (COA/Kontak/Produk, banyak field + relation) memakai
  full form-page route. Pola sudah konsisten di kode.
- Validation gate per-finding (A13-004..046, 060..084, 255..257) — gate hijau
  (build/lint/Playwright route-mock/backend) plus **live-mutating retest 2/2** ke
  app.finlite.my.id (login+render 6 page + bulk deactivate end-to-end). Rekonsiliasi
  cluster ada di `phase-25-completion-report.md`.

## Progress Lanjutan — Core Master Data

- COA memakai search/pagination server-side, relation parent, link edit, lifecycle bulk,
  error/retry state, persistent draft, inline API errors, dan tiga save intents.
- Contact memakai adapter `both` ke flags backend, search/pagination, link edit,
  lifecycle bulk, preload payment term, persistent draft, serta field kode/telepon.
- Product memakai search/pagination/category filter canonical, link edit, lifecycle bulk,
  SKU/kode produk, relation preload, account-type-filtered selects, validation stock item,
  persistent draft, dan tiga save intents.
- Department sekarang mengirim kode wajib, memakai search/pagination, reactivate,
  field error mapping, description, dan dialog semantics.
- Project sekarang mendukung kode wajib, description, `on_hold`, normalisasi tanggal,
  validasi range tanggal, search/pagination, serta active/inactive lifecycle.
- Payment term sekarang memakai pagination fungsional, search, reactivate,
  field error mapping, dialog description, serta rule hari `1..3650`.
- Category, Unit, dan Warehouse sekarang memakai search/pagination server-side
  serta reactivate. Unit menampilkan status; Warehouse mengekspos dan menampilkan
  `is_default` canonical yang sudah didukung backend.
