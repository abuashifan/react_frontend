# Prompt 1E - Error Pages & Onboarding

## Scope

Kerjakan Phase 1E: Error pages dan onboarding wizard.

Issue yang dicakup:
- ABU-38 Buat halaman 403
- ABU-39 Buat halaman 404
- ABU-40 Buat halaman 500
- ABU-41 Buat halaman Network Error
- ABU-42 Buat halaman Maintenance
- ABU-43 Buat Onboarding Wizard layout
- ABU-44 Step 1 - Informasi Perusahaan
- ABU-45 Step 2 - Pilih Template COA
- ABU-46 Step 3 - Account Mapping
- ABU-47 Step 4 - Master Data Dasar
- ABU-48 Step 5 - Opening Balance
- ABU-49 Step 6 - Selesai

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/08-form-architecture.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/18-onboarding-wizard.md`
- `frontend/docs/21-error-pages-and-print-export.md`
- `frontend/docs/22-implementation-roadmap.md`
- `docs_global/audit-docs/frontend-api-contract.md`

## Arahan Kerja

Bangun halaman error yang minimal, jelas, dan konsisten. Lanjutkan dengan onboarding wizard untuk perusahaan baru sampai user bisa menyelesaikan setup awal secara terarah.

Onboarding harus membantu user menyiapkan company info, template COA, account mapping, master data dasar, opening balance, dan completion state. Pastikan step tidak bisa diskip secara tidak valid.

## Batasan

- Jangan membuat modul Settings penuh pada prompt ini.
- Jangan membuat CRUD master data lengkap selain kebutuhan onboarding minimal.
- Jangan membuat export/print report selain kebutuhan error page.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Halaman 403, 404, 500, Network Error, dan Maintenance tersedia.
- ErrorBoundary dari prompt 1D dipakai pada error flow bila sudah tersedia; jika belum tersedia, catat sebagai dependency tanpa menduplikasi scope.
- Onboarding wizard memiliki layout sidebar 6 step dan navigasi step yang valid.
- Step company info mengikuti field wajib.
- Step template COA punya card selection dan preview.
- Step account mapping memvalidasi mapping required.
- Step master data dasar memastikan minimal data penting tersedia.
- Step opening balance dan selesai memberi state yang jelas.
- Error dan validation feedback memakai toast atau field error sesuai aturan.

## Verifikasi

Uji route error, navigation antar step, validasi step wajib, warning saat mengganti template COA, dan tampilan tablet/desktop.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Flow onboarding yang tersedia.
- Verifikasi yang dilakukan.
- Asumsi API atau data mock yang masih perlu diganti.
