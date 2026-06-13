# Prompt 6C - Report Infrastructure

## Scope

Kerjakan Phase 6C: Report infrastructure.

Issue yang dicakup:
- ABU-111 Report navigation - Ribbon + Grid Card
- ABU-112 Report Filter Page - Tab Parameter
- ABU-113 Report Filter Page - Tab Filter & Kolom
- ABU-114 Report Filter collapse + compact bar

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/13-filter-and-search.md`
- `frontend/docs/16-reports-module.md`
- `frontend/docs/21-error-pages-and-print-export.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`

## Arahan Kerja

Bangun fondasi module laporan: navigasi laporan, grid card kategori, filter page, tab Parameter, tab Filter & Kolom, dan compact filter bar setelah laporan ditampilkan.

Bagian Filter & Kolom harus mengikuti layout tiga panel horizontal sesuai dokumen. Selection baris dan checkbox kolom adalah dua state berbeda. Reorder harus jelas dan tidak membingungkan.

## Batasan

- Jangan membangun renderer laporan financial/tabular penuh pada prompt ini selain placeholder integrasi yang diperlukan.
- Jangan membuat export PDF/Excel pada prompt ini. Export PDF, Export Excel, dan Print CSS dikerjakan di prompt 06E. Sediakan hook/slot kosong atau stub di compact bar jika diperlukan agar tombol bisa diwire tanpa refactor besar di 06E.
- Jangan menyederhanakan layout Filter & Kolom dari dokumen.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Report tab/ribbon dan grid card kategori tersedia.
- Report filter page memiliki tab Parameter dan Filter & Kolom.
- Parameter mendukung periode, tampilan, dan dimensi analitik.
- Filter & Kolom memakai layout tiga panel: kolom, reorder, filter detail.
- Compact filter bar muncul setelah laporan ditampilkan dan bisa expand kembali.
- Permission `reports.view` diterapkan.
- State filter dapat dipertahankan secara wajar, termasuk URL/query bila sesuai pola project.

## Verifikasi

Uji navigasi report card, filter tab switching, column check/select behavior, reorder state, compact/expanded filter, permission state, and responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Infrastructure report yang sudah siap dipakai renderer.
- Verifikasi yang dijalankan.
- Risiko untuk prompt 6D/6E.
