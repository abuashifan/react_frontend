# Prompt 2B - Produk & Master Data

## Scope

Kerjakan Phase 2B: Produk dan master data pendukung.

Issue yang dicakup:
- ABU-54 Produk - List Page
- ABU-55 Produk - Form Page
- ABU-56 Kategori Produk - List & Form
- ABU-57 Satuan - List & Form
- ABU-58 Gudang - List & Form
- ABU-59 Payment Terms - List & Form
- ABU-60 Departemen - List & Form
- ABU-61 Proyek - List & Form
- ABU-62 Account Mapping - Settings

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/03-folder-structure.md`
- `frontend/docs/08-form-architecture.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/13-filter-and-search.md`
- `frontend/docs/15-module-patterns.md`
- `frontend/docs/19-settings-module.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Lengkapi master data yang dibutuhkan oleh transaksi Sales, Purchase, Inventory, Accounting, dan Reports. Gunakan pola list/form yang konsisten, reusable, dan permission-aware.

Account Mapping harus jelas membedakan mapping required dan conditional required. Beri warning bahwa perubahan mapping hanya mempengaruhi transaksi yang diposting setelah perubahan disimpan.

## Batasan

- Jangan membuat transaksi Sales, Purchase, Inventory, atau Accounting pada prompt ini.
- Jangan membuat Settings module penuh selain Account Mapping yang termasuk scope.
- Jangan mengubah struktur shared component kecuali benar-benar dibutuhkan.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Produk list/form tersedia dengan relasi kategori, satuan, tipe produk, dan status aktif.
- Kategori produk, satuan, gudang, payment terms, departemen, dan proyek punya list/form sesuai kebutuhan.
- Account Mapping Settings memakai SearchableSelect dan mengikuti mapping key dari backend.
- Filter produk mengikuti dokumen filter.
- Semua API call typed dan berada di services modul.
- Semua list memakai DataTable standar.
- Permission diterapkan di route, ribbon, dan action.

## Verifikasi

Uji CRUD/toggle active setiap master data, search, pagination, validation error, account mapping update, dan integrasi SearchableSelect.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Master data yang sudah siap dipakai transaksi.
- Verifikasi yang dijalankan.
- Risiko account mapping atau API contract yang perlu dicatat.
