# Prompt 2A - COA & Kontak

## Scope

Kerjakan Phase 2A: Master Data COA dan Kontak.

Issue yang dicakup:
- ABU-50 COA - List Page
- ABU-51 COA - Form Page
- ABU-52 Kontak - List Page
- ABU-53 Kontak - Form Page

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/03-folder-structure.md`
- `frontend/docs/08-form-architecture.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/13-filter-and-search.md`
- `frontend/docs/15-module-patterns.md`
- `frontend/docs/22-implementation-roadmap.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun workspace master data untuk Chart of Accounts dan Kontak sebagai fondasi semua transaksi. Ikuti pola module implementation: types, schema, service, hooks, list page, form page, route, dan ribbon registration.

COA harus memperjelas tipe akun, parent/child, status aktif, dan akun posting. Kontak harus mendukung customer, supplier, atau keduanya sesuai kebutuhan bisnis.

## Batasan

- Jangan membuat modul produk, gudang, atau payment terms pada prompt ini.
- Jangan membuat transaksi yang memakai COA atau Kontak.
- Jangan hardcode account id.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- COA list memakai DataTable standar, search, pagination, status aktif, dan action sesuai permission.
- COA form mendukung create/edit dan activate/deactivate sesuai API.
- Kontak list memakai DataTable standar, search, pagination, tipe customer/supplier, dan status aktif.
- Kontak form mendukung create/edit dengan validasi dasar.
- Semua API call berada di service modul.
- Semua fetch/mutation memakai TanStack Query.
- Permission route, ribbon, dan action button diterapkan.

## Verifikasi

Uji list, create, edit, activate/deactivate, empty state, validation error, permission hidden state, dan responsive table.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Route dan menu yang ditambahkan.
- Verifikasi yang dijalankan.
- Risiko atau mismatch API yang ditemukan.
