# Prompt 3D - Receipt, Deposit & Return

## Scope

Kerjakan Phase 3D: Customer Deposit, Sales Receipt, Sales Return, dan Source Document Picker.

Issue yang dicakup:
- ABU-73 Customer Deposit - List Page
- ABU-74 Customer Deposit - Form Page
- ABU-75 Sales Receipt - List Page
- ABU-76 Sales Receipt - Form Page
- ABU-77 Sales Return - List Page
- ABU-78 Sales Return - Form Page
- ABU-80 Source Document Picker

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
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Lengkapi transaksi downstream Sales yang mempengaruhi piutang, pembayaran, deposit, return, journal, dan stock return. Source Document Picker harus membantu user memilih sumber yang valid dan hanya menampilkan dokumen yang bisa dipakai.

Receipt harus mencegah overpayment. Deposit allocation harus mencegah allocation melebihi remaining deposit atau invoice balance. Return harus mencegah return quantity melebihi quantity yang tersedia.

## Batasan

- Jangan membuat AR Summary pada prompt ini kecuali link dasar.
- Jangan membuat shared document components bila sudah dikerjakan di prompt 3E, kecuali diperlukan minimal.
- Jangan mengubah Sales Invoice logic di luar integrasi yang dibutuhkan.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Customer Deposit list/form tersedia dengan post, void, refund, dan allocation ke invoice sesuai permission.
- Sales Receipt list/form tersedia dengan customer context, multi-line invoice payment, post, dan void.
- Sales Return list/form tersedia dengan create from invoice atau delivery order sesuai API.
- Source Document Picker menampilkan dokumen eligible dan availability context.
- Overpayment, over-allocation, dan over-return dicegah di UI sejauh data tersedia.
- Confirmation tersedia untuk post/void/refund sesuai dampak.
- Downstream dependence ditampilkan jelas pada dokumen terkait.

## Verifikasi

Uji deposit post/allocation/refund/void, receipt multi-line post/void, return from invoice/source, source picker filtering, permission state, validation error, dan balance update display.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Flow downstream Sales yang sudah siap.
- Verifikasi yang dijalankan.
- Risiko reconciliation AR yang perlu dicatat.
