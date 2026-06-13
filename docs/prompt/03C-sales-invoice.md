# Prompt 3C - Sales Invoice

## Scope

Kerjakan Phase 3C: Sales Invoice.

Issue yang dicakup:
- ABU-71 Sales Invoice - List Page
- ABU-72 Sales Invoice - Form Page

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
- `docs_global/audit-docs/04-sales-workflow-audit.md`
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun Sales Invoice sebagai dokumen akuntansi utama di Sales. Invoice dapat dibuat langsung atau dari Sales Order, Delivery Order, dan Proforma. Posting invoice berdampak ke journal AR/revenue/tax, dan direct stock invoice dapat berdampak ke stock movement.

UI harus sangat hati-hati pada post dan void: tampilkan confirmation, status read-only yang benar, balance due, paid amount, returned amount, dan dependence lock bila ada receipt/return/deposit allocation posted.

## Batasan

- Jangan membuat Sales Receipt, Customer Deposit, Sales Return, atau AR Summary pada prompt ini.
- Jangan membuat report accounting.
- Jangan hardcode account mapping.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Sales Invoice list memakai DataTable, status badge, payment status filter, customer filter, date filter, search, dan pagination.
- Sales Invoice form mendukung create direct dan create from source documents yang tersedia.
- Approve, post, dan void action mengikuti permission, auto-post setting, dan status.
- Post confirmation menjelaskan dampak journal.
- Direct invoice stock flow menampilkan kebutuhan warehouse untuk stock item.
- Form menampilkan total, paid amount, returned amount, dan balance due.
- Void disabled atau locked ketika invoice punya downstream posted.
- Error account mapping, period lock, over-invoice, dan validation ditampilkan jelas.

## Verifikasi

Uji create direct, create from source, approve, post, void, paid/partial/posted display, filter payment status, permission state, validation error, dan responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Source invoice flow yang didukung.
- Verifikasi yang dijalankan.
- Risiko untuk receipt/deposit/return.
