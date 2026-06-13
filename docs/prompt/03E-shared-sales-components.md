# Prompt 3E - Shared Sales Components

## Scope

Kerjakan Phase 3E: Shared components untuk dokumen transaksi Sales dan modul berikutnya.

Issue yang dicakup:
- ABU-81 DocumentLockedBanner component
- ABU-82 VoidConfirmDialog component
- ABU-83 DocumentActionBar component
- ABU-84 useDocumentActions hook
- ABU-85 LineItemsTable component
- ABU-86 FormSummary component

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/07-component-library.md`
- `frontend/docs/08-form-architecture.md`
- `frontend/docs/10-document-workflow.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/15-module-patterns.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun komponen transaksi shared yang akan dipakai Sales, Purchase, Inventory, dan Accounting. Fokus utama adalah locked state, void confirmation, action bar, document actions, line item editing, dan summary amount.

Komponen harus bekerja dengan status, permission, auto-post setting, dependence posted, dan read-only mode. Ini adalah bagian kritis agar workflow dokumen tidak salah.

## Batasan

- Jangan membuat halaman bisnis baru kecuali untuk integrasi atau demo internal yang diperlukan.
- Jangan membuat behavior khusus Sales yang membuat komponen sulit dipakai Purchase.
- Jangan hardcode status atau permission spesifik jika bisa dibuat generic sesuai dokumen.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- DocumentLockedBanner menampilkan dependence dari hilir ke hulu dengan link dokumen.
- VoidConfirmDialog mewajibkan reason minimal dan menjelaskan dampak void.
- DocumentActionBar menampilkan action sesuai status, permission, auto-post, dan locked state.
- useDocumentActions menghasilkan action dan edit mode yang konsisten dengan matrix dokumen.
- LineItemsTable mendukung editable/read-only, amount, quantity, unit, product, dan validation state.
- FormSummary menampilkan subtotal, discount, tax, grand total, paid/returned/balance bila relevan.

## Verifikasi

Uji kombinasi status draft, approved, posted tanpa dependence, posted dengan dependence, void, auto-post on/off, permission berbeda, read-only line item, dan summary calculation display.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Komponen shared yang siap dipakai modul lain.
- Verifikasi matrix workflow yang dilakukan.
- Risiko integrasi dengan Purchase/Inventory.
