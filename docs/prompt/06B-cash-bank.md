# Prompt 6B - Cash & Bank

## Scope

Kerjakan Phase 6B: Cash & Bank module.

Issue yang dicakup:
- ABU-107 Cash Receipt - List & Form
- ABU-108 Cash Payment - List & Form
- ABU-109 Bank Transfer - List & Form
- ABU-110 Bank Reconciliation - List & Form

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
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun Cash & Bank untuk transaksi kas umum, pembayaran kas, transfer bank, dan rekonsiliasi. Semua posting cash/bank berdampak ke journal system dan harus mengikuti period/date guard.

UI harus memperjelas akun kas/bank, amount, direction, source, fee/interest jika tersedia, reconciliation status, dan aksi post/void.

## Batasan

- Jangan membuat AR Receipt atau Vendor Payment ulang; itu sudah ada di Sales/Purchase.
- Jangan membuat report cash flow penuh.
- Jangan hardcode cash/bank account id.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Cash Receipt list/form tersedia dengan post/void sesuai permission.
- Cash Payment list/form tersedia dengan post/void sesuai permission.
- Bank Transfer list/form tersedia dengan from account, to account, amount, and post/void.
- Bank Reconciliation list/form tersedia sesuai endpoint dan data shape.
- Confirmation tersedia untuk post/void yang membuat atau membatalkan journal.
- Filter date/account/status/search diterapkan sejauh API mendukung.
- Error period lock, account invalid, insufficient data, and validation jelas.

## Verifikasi

Uji create/post/void cash receipt, cash payment, bank transfer, reconciliation flow, permission state, validation error, and responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Cash/bank flow yang sudah tersedia.
- Verifikasi yang dijalankan.
- Risiko API atau reconciliation yang perlu dicatat.
