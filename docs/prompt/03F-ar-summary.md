# Prompt 3F - AR Summary

## Scope

Kerjakan Phase 3F: Accounts Receivable Summary.

Issue yang dicakup:
- ABU-79 AR Summary Page

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/13-filter-and-search.md`
- `frontend/docs/15-module-patterns.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/04-sales-workflow-audit.md`
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun halaman ringkasan Piutang Usaha yang memakai endpoint AR khusus, bukan invoice list biasa. Halaman harus membantu finance melihat customer summary, open invoices, aging, ledger, dan reconciliation access sesuai permission.

Fokus pada kemampuan scan cepat: total piutang, aging bucket, customer balance, invoice balance, dan link ke detail dokumen terkait.

## Batasan

- Jangan membuat Report module penuh.
- Jangan membuat Sales Invoice baru.
- Jangan membuat export PDF/Excel kecuali sudah tersedia di report infrastructure.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- AR Summary page tersedia di ribbon Sales/Piutang.
- Menggunakan endpoint AR sesuai API contract.
- Menampilkan customer summary, open invoices, aging, dan ledger access sesuai data yang tersedia.
- Reconciliation action hanya tampil untuk permission `sales.ar.reconcile`.
- Angka uang right-aligned dan tabular.
- Empty/loading/error state jelas.
- Link ke customer/invoice ledger atau dokumen terkait bekerja sesuai route.

## Verifikasi

Uji permission `sales.ar.view`, permission reconcile, customer summary, aging, open invoices, ledger navigation, empty state, dan responsive table.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Endpoint AR yang dipakai.
- Verifikasi yang dijalankan.
- Risiko reconciliation atau data shape yang perlu dicatat.
