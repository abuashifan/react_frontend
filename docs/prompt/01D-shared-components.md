# Prompt 1D - Shared Components

## Scope

Kerjakan Phase 1D: Shared Components dasar.

Issue yang dicakup:
- ABU-28 Buat DocumentStatusBadge component
- ABU-29 Buat DataTable component
- ABU-30 Buat TablePagination component
- ABU-31 Buat SearchableSelect component
- ABU-32 Buat FormSection component
- ABU-33 Buat Toast system
- ABU-34 Buat ErrorBoundary component
- ABU-35 Buat EmptyState component
- ABU-36 Buat FilterSidebar component
- ABU-37 Buat BulkActionBar component

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/03-folder-structure.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/07-component-library.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/13-filter-and-search.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/21-error-pages-and-print-export.md`
- `frontend/docs/22-implementation-roadmap.md`

## Arahan Kerja

Bangun komponen shared yang akan dipakai berulang di seluruh modul. Fokus pada konsistensi, typing props, empty/loading states, permission-aware bulk action, status badge standar, dan filter sidebar contextual.

Komponen harus generic tetapi tidak abstrak berlebihan. Gunakan design token dan pola visual Seaside Escape ERP secara konsisten.

## Batasan

- Jangan membuat komponen khusus satu modul jika belum diperlukan.
- Jangan membuat DataTable custom per halaman.
- Jangan mengubah status color dari design token.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- DocumentStatusBadge mendukung semua status standar.
- DataTable mendukung horizontal scroll, sticky checkbox, sticky nomor dokumen, loading, empty state, selection, dan bulk action.
- TablePagination hanya mendukung 25, 50, dan 100 rows.
- SearchableSelect mendukung search/debounce/loading/empty state.
- FormSection mendukung layout 1 dan 2 kolom.
- Toast system sesuai durasi dan tipe feedback.
- ErrorBoundary tersedia untuk error runtime.
- EmptyState, FilterSidebar, dan BulkActionBar siap dipakai modul berikutnya.

## Verifikasi

Render semua komponen minimal dalam halaman/dev scenario yang aman. Uji viewport tablet dan desktop, selection table, pagination, empty state, toast, dan status badge.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Komponen shared yang dibuat.
- Verifikasi UI yang dilakukan.
- Komponen yang perlu diperluas oleh prompt berikutnya.
