# Prompt 3B - Delivery & Proforma

## Scope

Kerjakan Phase 3B: Delivery Order dan Proforma Invoice.

Issue yang dicakup:
- ABU-67 Delivery Order - List Page
- ABU-68 Delivery Order - Form Page
- ABU-69 Proforma Invoice - List Page
- ABU-70 Proforma Invoice - Form Page

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/08-form-architecture.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/10-document-workflow.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/13-filter-and-search.md`
- `frontend/docs/15-module-patterns.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/04-sales-workflow-audit.md`
- `docs_global/audit-docs/06-inventory-workflow-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun Delivery Order sebagai dokumen yang dapat membuat stock movement saat deliver. Aksi deliver wajib memakai confirmation karena berdampak ke inventory. Proforma Invoice adalah dokumen non-stock dan non-journal yang bisa menjadi jalur ke invoice berikutnya.

Pastikan remaining quantity dari Sales Order terlihat jelas dan user tidak terdorong membuat over-delivery. Status delivery dan proforma harus konsisten dengan backend contract.

## Batasan

- Jangan membuat Sales Invoice pada prompt ini.
- Jangan membuat Receipt, Deposit, Return, atau AR Summary.
- Jangan mengubah average costing atau inventory formula.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Delivery Order list/form tersedia dengan create from Sales Order.
- Delivery action ready, ship, deliver, cancel, void tersedia sesuai permission dan status.
- Deliver confirmation menjelaskan dampak stock movement `sales_out`.
- Void state mengikuti dependence rule jika ada invoice/return posted.
- Proforma list/form tersedia dengan create from Sales Order dan actions issue, accept, cancel.
- Semua list/form mengikuti shared layout, table, filter, toast, dan permission rules.

## Verifikasi

Uji create from Sales Order, workflow delivery, deliver confirmation, proforma issue/accept/cancel, permission hidden state, validation error, dan responsive behavior.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Dampak stock-related UI yang sudah diamankan.
- Verifikasi yang dijalankan.
- Risiko untuk Sales Invoice berikutnya.
