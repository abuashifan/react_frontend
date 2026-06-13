# Prompt 1B - Auth Pages

## Scope

Kerjakan Phase 1B: Auth Pages dan akses awal aplikasi.

Issue yang dicakup:
- ABU-15 Buat Login Page
- ABU-16 Buat Company Picker Page
- ABU-17 Implementasi auth flow post-login
- ABU-18 Buat Route Guards
- ABU-19 Implementasi Session Timeout
- ABU-20 Buat usePermission hook
- ABU-21 Buat PermissionGuard component

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/01-project-context.md`
- `frontend/docs/02-stack-and-dependencies.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/17-auth-and-company.md`
- `frontend/docs/22-implementation-roadmap.md`
- `docs_global/audit-docs/frontend-api-contract.md`

## Arahan Kerja

Bangun login flow yang siap dipakai untuk aplikasi ERP multi-company. Login harus mengarah ke dashboard jika user hanya punya satu perusahaan, atau ke company picker jika punya lebih dari satu perusahaan. Route guard harus melindungi halaman berdasarkan token dan permission.

Company picker harus memprioritaskan kejelasan pilihan perusahaan. Session timeout harus mengikuti setting company dengan warning sebelum logout. Permission hook dan guard akan menjadi dasar semua phase berikutnya, jadi pastikan API-nya sederhana dan konsisten.

## Batasan

- Jangan membuat halaman dashboard penuh pada prompt ini.
- Jangan membuat layout app shell utama selain yang dibutuhkan auth flow.
- Jangan hardcode permission selain contoh yang dibutuhkan untuk guard.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Login page sesuai spesifikasi split screen.
- Company picker menampilkan daftar perusahaan dengan urutan akses terakhir.
- Auth flow menyimpan token, user, company, dan permission sesuai kebutuhan.
- Route guard mengarahkan unauthenticated user ke login dan forbidden user ke 403.
- Session timeout bekerja dengan idle detection dan warning dialog.
- `usePermission` dan `PermissionGuard` tersedia dan bisa dipakai phase berikutnya.
- Error login dan network error tampil melalui toast yang jelas.

## Verifikasi

Uji login sukses, login gagal, satu company, multi company, route tanpa token, route tanpa permission, dan session warning bila memungkinkan. Laporkan hasilnya ringkas.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Flow auth yang sudah berjalan.
- Verifikasi yang dijalankan.
- Risiko, asumsi API, atau dependency ke backend.
