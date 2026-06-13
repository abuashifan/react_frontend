# Prompt 7B - Settings

## Scope

Kerjakan Phase 7B: Settings module.

Issue yang dicakup:
- ABU-129 Settings navigation - Ribbon
- ABU-130 Pengaturan Perusahaan
- ABU-131 Pengaturan Transaksi
- ABU-132 Standar Akun (Account Mapping)
- ABU-133 Pengguna - List & Form
- ABU-134 Role & Akses
- ABU-135 Preferensi Saya

Catatan: Ribbon Settings memiliki 7 item sesuai `frontend/docs/19-settings-module.md`, termasuk "Akun & Periode". Item tersebut tidak dibangun di sini karena halamannya sudah selesai di prompt 06A melalui Fiscal Year Management dan Period Lock. Tugas di sini hanya mendaftarkan item "Akun & Periode" di ribbon Settings dan mengarahkannya ke route yang sudah ada dari 06A.

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/08-form-architecture.md`
- `frontend/docs/09-table-and-list.md`
- `frontend/docs/10-document-workflow.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/19-settings-module.md`
- `docs_global/audit-docs/frontend-api-contract.md`
- `docs_global/audit-docs/08-business-rules-and-validation-map.md`

## Arahan Kerja

Bangun Settings sebagai area administrasi untuk company, transaction behavior, account mapping, users, roles, dan personal preferences. Settings tidak memakai filter sidebar dan harus memakai ribbon settings.

Auto-post setting adalah konfigurasi kritis karena mempengaruhi workflow dokumen di seluruh aplikasi. Account Mapping juga kritis karena mempengaruhi posting journal transaksi berikutnya. Beri warning yang jelas untuk perubahan berisiko.

## Batasan

- Jangan membuat ulang onboarding.
- Jangan mengubah transaksi existing ketika mapping berubah; UI harus menjelaskan bahwa efeknya untuk transaksi setelah perubahan disimpan.
- Jangan membuat forgot password di login; reset password dilakukan admin dari Settings.
- Jangan membangun ulang halaman Fiscal Year atau Period Lock. Keduanya sudah selesai di prompt 06A. Cukup daftarkan ribbon item "Akun & Periode" dan arahkan ke route eksisting dari 06A.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Settings navigation tersedia di topbar/ribbon sesuai dokumen, mencakup semua 7 item ribbon termasuk "Akun & Periode" yang mengarah ke route Fiscal Year/Period Lock dari prompt 06A.
- Pengaturan Perusahaan form tersedia.
- Pengaturan Transaksi mendukung auto-post, approval workflow, number format, dan session timeout.
- Standar Akun memakai account mapping sections dan warning perubahan mapping.
- Pengguna list/form tersedia dengan status, role, last login, deactivate, dan reset password bila API tersedia.
- Role & Akses menampilkan permission grouped by module dengan checkbox.
- Preferensi Saya mendukung language, date format, and number format.
- Permission route/action diterapkan untuk settings admin.

## Verifikasi

Uji settings navigation, company update, auto-post toggle impact, approval display, account mapping update warning, user list/form, role permission update, preference update, permission state, and responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Settings area yang sudah tersedia.
- Verifikasi yang dijalankan.
- Risiko konfigurasi yang perlu dikomunikasikan ke PM.
