# Prompt 4C - Payment, Deposit & Return

## Scope

Kerjakan Phase 4C: Vendor Deposit, Vendor Payment, Purchase Return, dan AP Summary.

Issue yang dicakup:
- ABU-95 Vendor Deposit - List & Form
- ABU-96 Vendor Payment - List & Form
- ABU-97 Purchase Return - List & Form
- ABU-98 AP Summary Page

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
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Lengkapi downstream Purchase yang mempengaruhi hutang, pembayaran, deposit vendor, return, AP ledger, dan reconciliation. Payment harus mencegah overpayment. Deposit allocation harus mencegah allocation melebihi remaining deposit atau bill balance. Purchase Return harus mengikuti source bill atau goods receipt.

AP Summary harus menggunakan endpoint AP khusus, bukan Vendor Bill list biasa.

## Batasan

- Jangan membuat Report module penuh.
- Jangan membuat fitur vendor credit note di luar flow backend existing.
- Jangan mengubah behavior paid bill return yang diblokir backend.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Vendor Deposit list/form tersedia dengan post, void, refund, dan allocation ke bill.
- Vendor Payment list/form tersedia dengan vendor context, multi-line bill payment, post, dan void.
- Purchase Return list/form tersedia dari Vendor Bill atau Goods Receipt sesuai API.
- AP Summary menampilkan vendor summary, open bills, aging, ledger, dan reconciliation access sesuai permission.
- Overpayment, over-allocation, dan over-return dicegah di UI sejauh data tersedia.
- Paid bill return block ditampilkan dengan pesan yang jelas.
- Permission, toast, confirmation, and DataTable rules diterapkan.

## Verifikasi

Uji deposit post/allocation/refund/void, payment multi-line post/void, return from bill/GR, AP summary, permission state, validation error, and responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Flow downstream Purchase dan AP yang sudah siap.
- Verifikasi yang dijalankan.
- Risiko reconciliation AP yang perlu dicatat.
