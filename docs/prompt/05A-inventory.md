# Prompt 5A - Inventory

## Scope

Kerjakan Phase 5A: Inventory module.

Issue yang dicakup:
- ABU-99 Stock Balance - List Page
- ABU-100 Stock Movement - List & Form
- ABU-101 Stock Adjustment - List & Form
- ABU-102 Stock Opname - List & Form

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/08-form-architecture.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/10-document-workflow.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/13-filter-and-search.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/15-module-patterns.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/06-inventory-workflow-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun workspace inventory untuk melihat stock balance, stock movement, stock adjustment, dan stock opname. Inventory adalah area berisiko tinggi karena berdampak ke stock balance, average cost, dan journal inventory.

UI harus memperjelas movement type, direction, product, warehouse, quantity, stock availability, posting, void, adjustment variance, dan opname difference. Negative stock disabled harus tercermin dalam pesan error dan guard UI sejauh data tersedia.

## Batasan

- Jangan mengubah formula average cost.
- Jangan membuat transfer stock jika backend validator belum mendukung movement transfer.
- Jangan mengabaikan known risk mixed adjustment/opname in-out; tampilkan catatan atau guard UI jika perlu.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Stock Balance list tersedia dengan filter produk/kategori dan table standar.
- Stock Movement list/form tersedia dengan post/void sesuai permission.
- Stock Adjustment list/form tersedia dengan approve, post, void, dan line variance.
- Stock Opname list/form tersedia dengan generate lines, update count, counted/finalize/void.
- Confirmation tersedia untuk post/finalize/void yang berdampak stock.
- Movement direction dan quantity ditampilkan jelas.
- Error insufficient stock, period lock, mapping missing, and validation ditampilkan jelas.
- Known risk transfer dan mixed movement tidak membuat UI menyesatkan user.

## Verifikasi

Uji stock balance list, movement create/post/void, adjustment mixed/in/out scenario jika memungkinkan, opname generate/count/finalize/void, permission state, validation error, and responsive table.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Inventory workflow yang sudah tersedia.
- Verifikasi yang dijalankan.
- Risiko backend inventory yang perlu dicatat untuk PM.
