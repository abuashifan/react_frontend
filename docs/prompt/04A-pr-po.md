# Prompt 4A - PR & PO

## Scope

Kerjakan Phase 4A: Purchase Request dan Purchase Order.

Issue yang dicakup:
- ABU-87 Purchase Request - List Page
- ABU-88 Purchase Request - Form Page
- ABU-89 Purchase Order - List Page
- ABU-90 Purchase Order - Form Page

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
- `docs_global/audit-docs/05-purchase-workflow-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun awal workflow Purchase dari Purchase Request ke Purchase Order. PR dan PO tidak langsung membuat stock atau journal, tetapi menjadi sumber downstream untuk Goods Receipt, Vendor Bill, dan Vendor Deposit.

Pastikan vendor, line item, approval flow, conversion, dan quantity tracking ditampilkan dengan jelas. Ikuti pattern Sales yang sudah ada, tetapi gunakan istilah dan permission Purchase.

## Batasan

- Jangan membuat Goods Receipt, Vendor Bill, Payment, Deposit, Return, atau AP Summary pada prompt ini.
- Jangan copy-paste komponen Sales jika seharusnya reusable.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Purchase Request list/form tersedia dengan submit, approve, reject, cancel sesuai permission.
- Purchase Order list/form tersedia dengan create from PR dan approve, confirm, cancel, close sesuai permission.
- List memakai DataTable, filter vendor/date/status, search, dan pagination.
- Form mengikuti document workflow, read-only, locked state, and action bar.
- Quantity tracking pada PO line ditampilkan jika data tersedia.
- Permission route, ribbon, and action diterapkan.

## Verifikasi

Uji create/edit draft, submit/approve/reject/cancel PR, create PO from PR, approve/confirm/cancel/close PO, permission state, validation error, dan responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Flow PR to PO yang sudah berjalan.
- Verifikasi yang dijalankan.
- Risiko untuk Goods Receipt/Vendor Bill.
