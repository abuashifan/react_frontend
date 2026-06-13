# Prompt 7A - Dashboard

## Scope

Kerjakan Phase 7A: Dashboard.

Issue yang dicakup:
- ABU-123 Buat Dashboard Page
- ABU-124 KPI Cards
- ABU-125 Dokumen Pending
- ABU-126 Grafik Penjualan vs Pembelian
- ABU-127 Grafik Arus Kas
- ABU-128 Aktivitas Terbaru

## Dokumen Wajib Dibaca

- `frontend/CLAUDE.md`
- `frontend/docs/01-project-context.md`
- `frontend/docs/04-design-tokens.md`
- `frontend/docs/06-responsive-rules.md`
- `frontend/docs/11-permission-rules.md`
- `frontend/docs/12-api-integration.md`
- `frontend/docs/14-notification-rules.md`
- `frontend/docs/20-dashboard.md`
- `docs_global/audit-docs/frontend-api-contract.md`

## Arahan Kerja

Bangun dashboard sebagai halaman pertama setelah login. Dashboard harus menjawab pertanyaan: apa yang perlu diperhatikan hari ini. Fokus pada KPI, dokumen pending, grafik ringkas, dan aktivitas terbaru.

Dashboard harus permission-aware: widget yang user tidak boleh lihat tidak dirender. Layout tetap stabil walaupun beberapa widget disembunyikan.

Gunakan Recharts untuk semua grafik sesuai spesifikasi di `frontend/docs/20-dashboard.md`:
- Grafik Penjualan vs Pembelian memakai Recharts LineChart.
- Grafik Arus Kas memakai Recharts BarChart.

Jangan menggunakan library charting lain atau implementasi SVG/Canvas manual. Recharts sudah tersedia di stack project.

## Batasan

- Jangan membuat landing page atau hero marketing.
- Jangan membuat report module ulang.
- Jangan menampilkan data dummy sebagai final jika endpoint sudah tersedia.
- Jangan menulis script lengkap di laporan akhir.

## Acceptance Criteria

- Dashboard page tersedia di route utama setelah login.
- KPI cards menampilkan Piutang, Hutang, Kas & Bank, dan Laba Bulan Ini sesuai permission.
- Dokumen Pending menampilkan alert card yang butuh perhatian.
- Grafik Penjualan vs Pembelian dan Arus Kas tersedia sesuai permission dan data.
- Aktivitas Terbaru tampil dengan link ke dokumen terkait bila tersedia.
- Loading, empty, error, and permission state rapi.
- Layout bekerja di tablet dan desktop.

## Verifikasi

Uji dashboard dengan permission lengkap dan terbatas, loading state, empty state, chart rendering, pending link navigation, activity link navigation, and responsive layout.

## Laporan Akhir

Laporkan:
- Checklist ABU yang selesai.
- Widget dashboard yang tersedia.
- Verifikasi yang dijalankan.
- Risiko endpoint atau data summary yang perlu dicatat.
