# Prompt 1C - App Shell & Layout

## Scope

Kerjakan Phase 1C: App Shell dan layout utama aplikasi.

Issue yang dicakup:
- ABU-22 Buat AppShell component
- ABU-23 Buat Topbar component
- ABU-24 Buat RibbonPanel component
- ABU-25 Buat WorkspaceLayout component
- ABU-26 Buat FormLayout component
- ABU-27 Buat FixedBottomBar component

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/01-project-context.md`
- `frontend/docs/03-folder-structure.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/05-layout-and-navigation.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/07-component-library.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/22-implementation-roadmap.md`

## Arahan Kerja

Bangun shell aplikasi yang menjadi dasar semua workspace ERP. Topbar harus selalu terlihat, ribbon harus contextual per module, list view memakai workspace layout, dan form view memakai layout full width dengan fixed bottom bar.

Pastikan pola compact scaling berjalan untuk tablet 768px ke atas. Layout harus terasa seperti aplikasi kerja yang padat, rapi, dan mudah dipindai, bukan landing page.

## Batasan

- Jangan membuat halaman bisnis lengkap.
- Jangan membuat table, form transaction, atau module service pada prompt ini.
- Jangan menampilkan menu ribbon yang tidak mempertimbangkan permission.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- AppShell mengatur topbar, ribbon, sidebar slot, dan content area.
- Topbar menampilkan module tabs, company aktif, dan user menu.
- RibbonPanel berubah sesuai active module dan menyembunyikan item tanpa permission.
- WorkspaceLayout siap untuk halaman list dengan title, breadcrumb, action, sidebar slot, dan content.
- FormLayout siap untuk halaman create/edit/detail dengan status, document number, dan fixed bottom bar.
- FixedBottomBar hanya cocok untuk form view dan tidak mengganggu konten.
- Layout tidak pecah pada target 768px, 1024px, dan desktop.

## Verifikasi

Uji perubahan active module, ribbon item permission, collapse state, list layout, form layout, dan ukuran viewport utama. Laporkan hasilnya ringkas.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Komponen layout yang tersedia.
- Catatan perilaku responsive.
- Risiko atau pekerjaan lanjutan untuk shared components.
