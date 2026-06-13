# Prompt 3A - Quotation & Order

## Scope

Kerjakan Phase 3A: Sales Quotation dan Sales Order.

Issue yang dicakup:
- ABU-63 Sales Quotation - List Page
- ABU-64 Sales Quotation - Form Page
- ABU-65 Sales Order - List Page
- ABU-66 Sales Order - Form Page

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
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun awal workflow Sales dari quotation ke order. Quotation tidak berdampak stock atau journal, tetapi status dan conversion harus jelas. Sales Order menjadi source downstream untuk delivery, invoice, proforma, dan deposit, sehingga form harus menampilkan tracking quantity secara read-only bila data tersedia.

Ikuti aturan dokumen transaksi: draft editable, status lain read-only sesuai workflow, action button permission-aware, dan auto-post setting harus mempengaruhi tombol.

## Batasan

- Jangan membuat Delivery Order, Invoice, Receipt, Deposit, Return, atau AR Summary pada prompt ini.
- Jangan membuat Source Document Picker shared jika belum masuk prompt 3D/3E, kecuali diperlukan minimal untuk create from quotation.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Sales Quotation list/form tersedia dengan workflow action send, approve, accept, reject, cancel sesuai permission.
- Sales Order list/form tersedia dengan workflow action approve, confirm, cancel, close sesuai permission.
- Sales Order bisa dibuat dari quotation sesuai API.
- List memakai DataTable, filter contextual, status badge, dan pagination standar.
- Form memakai FormLayout, FormSection, LineItemsTable bila sudah tersedia, dan FormSummary bila tersedia.
- Read-only/edit mode mengikuti document workflow.
- Toast dan confirmation sesuai aksi penting.

## Verifikasi

Uji list, create, edit draft, workflow action, create order from quotation, permission state, locked/read-only state, validation error, dan responsive table/form.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Flow quotation to order yang sudah berjalan.
- Verifikasi yang dijalankan.
- Risiko atau dependency ke prompt Sales berikutnya.
