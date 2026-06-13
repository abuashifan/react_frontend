# Prompt 6D - Financial Statement Reports

## Scope

Kerjakan Phase 6D: Financial Statement renderer.

Issue yang dicakup:
- ABU-115 Financial Statement renderer

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/16-reports-module.md`
- `frontend/docs/21-error-pages-and-print-export.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/07-accounting-and-reporting-audit.md`

## Arahan Kerja

Bangun renderer untuk financial statement seperti Balance Sheet, Profit & Loss, Cash Flow, Trial Balance, dan Financial Summary sesuai report yang tersedia. Render sebagai print preview, bukan editable table.

Prioritaskan keterbacaan angka, hierarki akun, header laporan, fully expanded default, saldo 0 hidden by default, dan right-aligned tabular numbers.

## Batasan

- Jangan membuat tabular report renderer pada prompt ini.
- Jangan membuat export PDF/Excel penuh jika belum masuk prompt 6E.
- Jangan menambahkan logo/alamat/NPWP ke header laporan jika tidak diminta dokumen.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Financial statement renderer tersedia dan terhubung dengan report filter infrastructure.
- Header laporan menampilkan nama perusahaan, judul laporan, dan periode/tanggal.
- Hierarki akun tampil jelas dengan indentation dan total/subtotal.
- Angka right-aligned, tabular, dan format currency konsisten.
- Print preview bersih dan siap untuk `window.print`.
- Loading, empty, and error state jelas.
- Permission reports diterapkan.

## Verifikasi

Uji beberapa report financial yang tersedia, parameter periode, show/hide zero balance, print preview CSS, empty state, error state, and responsive display.

Uji juga permission state: user tanpa `reports.view` harus diarahkan ke 403 atau halaman laporan tidak dapat diakses sama sekali.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Financial statement yang didukung.
- Verifikasi yang dijalankan.
- Risiko data shape atau backend report yang perlu dicatat.
