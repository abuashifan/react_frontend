# Prompt 1A - Project Setup

## Scope

Kerjakan Phase 1A: Project Setup untuk Seaside Escape ERP frontend.

Issue yang dicakup:
- ABU-1 Initialize React + Vite + TypeScript project
- ABU-2 Install semua dependencies
- ABU-3 Setup Tailwind CSS + design tokens
- ABU-4 Setup Shadcn/ui
- ABU-5 Setup path alias @/
- ABU-6 Buat struktur folder src/
- ABU-7 Buat file types global
- ABU-8 Buat lib/utils.ts
- ABU-9 Buat lib/constants.ts
- ABU-10 Setup Axios instance
- ABU-11 Setup Zustand stores
- ABU-12 Setup React Router v6
- ABU-13 Setup root App
- ABU-14 Buat .env.example

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/01-project-context.md`
- `frontend/docs/02-stack-and-dependencies.md`
- `frontend/docs/03-folder-structure.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/07-component-library.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/22-implementation-roadmap.md`

## Arahan Kerja

Bangun fondasi frontend yang stabil, typed, dan siap dipakai oleh semua phase berikutnya. Prioritaskan struktur project, dependency utama, konfigurasi styling, konfigurasi routing, state store, HTTP layer, utility global, dan environment contract.

Pastikan setup mengikuti aturan project, terutama pemisahan server state dan UI state, penggunaan path alias, penggunaan design token, serta response envelope API. Jangan membuat pola baru yang bertentangan dengan dokumen.

## Batasan

- Jangan menambahkan dependency di luar dokumen tanpa alasan kuat.
- Jangan membuat fitur bisnis pada prompt ini.
- Jangan membuat komponen domain Sales, Purchase, Inventory, Accounting, Report, Dashboard, atau Settings.
- Jangan menulis script lengkap di laporan akhir. Implementasi kode adalah tanggung jawab agent, tetapi laporan harus berupa ringkasan pekerjaan dan verifikasi.

## Acceptance Criteria

- Project dapat dijalankan sebagai React + Vite + TypeScript SPA.
- Tailwind dan design token dasar tersedia.
- Struktur folder sesuai dokumen.
- Axios instance siap dengan base URL, auth header, company header, dan error handling dasar.
- Zustand store dasar tersedia untuk auth, company, dan UI state.
- React Router tersedia dengan struktur awal.
- Root app sudah menyiapkan provider utama yang dibutuhkan.
- `.env.example` tersedia dan tidak berisi secret.

## Verifikasi

Jalankan pengecekan yang relevan untuk memastikan project bisa start tanpa error. Jika ada test atau lint yang sudah tersedia, jalankan. Laporkan command yang dijalankan dan hasilnya secara ringkas.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- File/folder utama yang dibuat atau diubah.
- Verifikasi yang dijalankan.
- Risiko atau pekerjaan lanjutan yang harus diperhatikan prompt berikutnya.
