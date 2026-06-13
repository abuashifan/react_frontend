# Prompt 6A - Journal & Accounting

## Scope

Kerjakan Phase 6A: Manual Journal dan Accounting controls.

Issue yang dicakup:
- ABU-103 Manual Journal - List Page
- ABU-104 Manual Journal - Form Page
- ABU-105 Fiscal Year Management
- ABU-106 Period Lock

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
- `frontend/docs/19-settings-module.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun Manual Journal dan kontrol accounting untuk fiscal year dan period lock. Manual journal harus menjaga balance debit/kredit, active account, dimension, dan tidak mendorong user memakai control account yang dilindungi.

Fiscal Year dan Period Lock harus jelas karena mempengaruhi kemampuan posting semua transaksi. Tampilkan status lock dengan bahasa yang mudah dipahami finance.

## Batasan

- Jangan membuat report renderer pada prompt ini.
- Jangan mengizinkan edit system-generated journal sebagai manual journal.
- Jangan mengubah kebijakan monthly period lock backend yang belum menjadi blocker penuh.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Manual Journal list/form tersedia dengan draft, approve, post, void sesuai permission.
- Journal lines menampilkan debit/kredit, account, department, project, dan balancing state.
- System-generated journal read-only dengan badge bila muncul di list/detail.
- Fiscal Year Management menampilkan status, closing preview/checklist/action sesuai API.
- Period Lock menampilkan status dan update lock date sesuai permission.
- Error unbalanced journal, protected account, period lock, fiscal year closed, and validation jelas.
- Permission, route guard, DataTable, and document workflow diterapkan.

## Verifikasi

Uji journal create balanced/unbalanced, approve/post/void, system-generated read-only, fiscal year status/actions, period lock update, permission state, and responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Accounting controls yang sudah tersedia.
- Verifikasi yang dijalankan.
- Risiko accounting/reporting yang perlu dicatat.
