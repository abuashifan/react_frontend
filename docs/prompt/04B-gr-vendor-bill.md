# Prompt 4B - GR & Vendor Bill

## Scope

Kerjakan Phase 4B: Goods Receipt dan Vendor Bill.

Issue yang dicakup:
- ABU-91 Goods Receipt - List Page
- ABU-92 Goods Receipt - Form Page
- ABU-93 Vendor Bill - List Page
- ABU-94 Vendor Bill - Form Page

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
- `docs_global/audit-docs/05-purchase-workflow-audit.md`
- `docs_global/audit-docs/06-inventory-workflow-audit.md`
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun Goods Receipt yang berdampak ke stock movement `purchase_in` dan GRNI journal saat receive. Bangun Vendor Bill yang berdampak ke AP journal dan dapat dibuat dari PO atau GR.

UI harus menonjolkan dampak receive dan post. Vendor Bill dari GR harus jelas berbeda dari direct bill stock agar user memahami sumber quantity dan warehouse requirement.

## Batasan

- Jangan membuat Vendor Payment, Vendor Deposit, Purchase Return, atau AP Summary pada prompt ini.
- Jangan mengubah inventory costing atau journal logic.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Goods Receipt list/form tersedia dengan create from PO dan actions receive, cancel, void.
- Receive confirmation menjelaskan dampak stock movement dan GRNI.
- Vendor Bill list/form tersedia dengan create direct, from PO, dan from GR.
- Vendor Bill approve, post, void mengikuti permission, status, auto-post, dan dependence.
- Payment status, balance due, paid amount, returned amount tampil jelas.
- Error account mapping, period lock, over-billing, and validation ditampilkan jelas.
- List/filter/table mengikuti standar.

## Verifikasi

Uji GR create/receive/void, Vendor Bill create direct/from source/approve/post/void, warehouse requirement, permission state, validation error, and responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Flow stock/AP yang sudah diamankan di UI.
- Verifikasi yang dijalankan.
- Risiko untuk payment/deposit/return.
