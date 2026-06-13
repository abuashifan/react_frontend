# Prompt 6E - Tabular Reports

## Scope

Kerjakan Phase 6E: Tabular reports, preset analysis, export, print, dan SystemGeneratedBadge.

Issue yang dicakup:
- ABU-116 Tabular Report renderer
- ABU-117 Buku Besar - filter akun
- ABU-118 Preset Analysis
- ABU-119 Export PDF - server-side
- ABU-120 Export Excel - server-side
- ABU-121 Print - @media print CSS
- ABU-122 SystemGeneratedBadge component

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/16-reports-module.md`
- `frontend/docs/21-error-pages-and-print-export.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`

## Arahan Kerja

Bangun renderer untuk tabular report seperti Buku Besar, AR/AP Aging, reconciliation, stock reports, sales/purchase transaction reports, dan report tabular lain yang tersedia. Tambahkan preset analysis untuk laporan yang relevan.

Export PDF dan Excel harus memakai server-side export jika endpoint tersedia. Print CSS harus menyembunyikan UI aplikasi dan menampilkan report content dengan bersih.

## Batasan

- Jangan membuat financial statement renderer ulang.
- Jangan melakukan export client-side jika dokumen/API mengarahkan server-side.
- Jangan menampilkan checkbox row atau bulk action pada tabular report.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Tabular report renderer memakai table standar tanpa checkbox, bulk action, pagination workspace, atau link form dokumen.
- Buku Besar mendukung filter akun sesuai kebutuhan.
- Preset Analysis tersedia untuk report yang ditentukan.
- Export PDF dan Excel memanggil server-side flow dan menampilkan loading/error state.
- Print CSS untuk laporan tersedia.
- SystemGeneratedBadge tersedia dan konsisten dengan manual journal/accounting.
- Angka dan tanggal tampil konsisten.

## Verifikasi

Uji tabular report utama, filter akun Buku Besar, preset analysis, export PDF, export Excel, print mode, SystemGeneratedBadge display, permission state, and responsive table.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Tabular report yang didukung.
- Verifikasi yang dijalankan.
- Risiko export atau data volume yang perlu dicatat.
