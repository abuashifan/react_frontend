# Phase 7 — Dashboard & Settings

**Label:** `dashboard`, `settings`
**Status:** ⏳ Belum dimulai (tunggu semua phase selesai)
**Verifikasi:** Dashboard load dengan data real. Settings tersimpan dan berpengaruh ke app.
**Commit:** `feat(dashboard): complete phase 7 — dashboard and settings`

---

## Sub-phase 7A — Dashboard

DashboardPage dirender via `useTabStore` tab `dashboard`.
Tidak ada route `/dashboard` — gunakan `navigate('/')` untuk ke Dashboard.
`paddingTop` sudah dihandle AppShell: 104px saat Dashboard aktif.
Tidak ada FilterSidebar dan FixedBottomBar di Dashboard.

### Dashboard & Virtual Tabs

Dashboard menggunakan primary tab pinned:
- Primary Tab "Dashboard" selalu ada di posisi pertama
- Dashboard tidak ada di Topbar
- Klik "Dashboard" di Primary Tabs → ribbon TIDAK muncul
- Secondary Tabs tidak muncul saat Dashboard aktif
- Content: DashboardPage render langsung di content area Dashboard

paddingTop: 104px
Tidak ada FixedBottomBar di dashboard
Tidak ada FilterSidebar di dashboard

### ISSUE-7A-01 — Dashboard Page layout
- Dirender via `useTabStore` tab `dashboard`
- paddingTop 104px dari AppShell
- Grid layout: KPI cards (baris atas), grafik (tengah), aktivitas terbaru (bawah/samping)
- Responsive: single column di mobile
- File: `src/modules/dashboard/pages/DashboardPage.tsx`

### ISSUE-7A-02 — KPI Cards
- 4 card utama: Piutang, Hutang, Kas & Bank, Laba Bulan Ini
- Setiap card: nilai utama + perubahan vs bulan lalu (% naik/turun)
- Loading skeleton saat fetch
- File: `src/modules/dashboard/components/KpiCards.tsx`

### ISSUE-7A-03 — Dokumen Pending alert cards
- Card per dokumen yang butuh aksi: SO menunggu konfirmasi, Invoice jatuh tempo, dll.
- Klik card → navigate ke list page relevan dengan filter pre-applied
- File: `src/modules/dashboard/components/PendingDocumentAlerts.tsx`

### ISSUE-7A-04 — Grafik Penjualan vs Pembelian
- Recharts `LineChart` — 12 bulan terakhir
- Dua line: Penjualan (warna teal `#5c9ead`) vs Pembelian (warna salmon `#e39774`)
- Tooltip dengan format Rupiah
- File: `src/modules/dashboard/components/SalesPurchaseChart.tsx`

### ISSUE-7A-05 — Grafik Arus Kas
- Recharts `BarChart` — 6 bulan terakhir
- Bar masuk vs bar keluar per bulan
- File: `src/modules/dashboard/components/CashFlowChart.tsx`

### ISSUE-7A-06 — Aktivitas Terbaru
- List 10 transaksi terakhir: ikon tipe, nomor dokumen, waktu relatif, status badge
- File: `src/modules/dashboard/components/RecentActivity.tsx`

---

## Sub-phase 7B — Settings

### Settings & Virtual Tabs

Settings menggunakan virtual tab system:
- Ribbon Settings berisi: Perusahaan, Transaksi, Standar Akun,
  Akun & Periode, Pengguna, Role & Akses, Preferensi
- Klik item ribbon Settings → `openPrimaryTab()` dengan id `settings-{menu}`
- Secondary Tab "Detail" otomatis dibuat (pinned, tidak bisa ditutup)
- Tidak ada FilterSidebar di settings
- Tidak ada FixedBottomBar di settings (save button ada di dalam form card)

### ISSUE-7B-01 — Settings navigation (ribbon)
- Ribbon khusus modul settings: Perusahaan, Transaksi, Standar Akun, Akun & Periode, Pengguna, Role & Akses, Preferensi
- File: `src/modules/settings/pages/SettingsPage.tsx`

### ISSUE-7B-02 — Pengaturan Perusahaan
- Fields: nama, alamat, NPWP, logo upload, mata uang default
- File: `src/modules/settings/pages/CompanySettingsPage.tsx`

### ISSUE-7B-03 — Pengaturan Transaksi
- Auto-post setelah approve: toggle per tipe dokumen
- Approval workflow: aktif/tidak per modul
- Format nomor dokumen: prefix, padding, reset per tahun
- Session timeout: durasi inaktivitas (menit)
- File: `src/modules/settings/pages/TransactionSettingsPage.tsx`

### ISSUE-7B-04 — Standar Akun (Account Mapping)
- Sama dengan halaman Account Mapping di master data, tapi konteks settings
- File: `src/modules/settings/pages/AccountMappingSettingsPage.tsx`

### ISSUE-7B-05 — Akun & Periode
- Lihat status tahun fiskal dan periode
- Shortcut ke Fiscal Year Management dan Period Lock
- File: `src/modules/settings/pages/AccountingPeriodPage.tsx`

### ISSUE-7B-06 — Pengguna List & Form
- List: nama, email, role, status aktif, last login
- Form create: nama, email, role, password
- Form edit: nama, email, role, reset password
- Actions: activate/deactivate user
- File: `src/modules/settings/pages/UsersPage.tsx`

### ISSUE-7B-07 — Role & Akses
- List role dengan jumlah permission aktif
- Form edit permission per role: checkbox tree per modul
- File: `src/modules/settings/pages/RolesPage.tsx`

### ISSUE-7B-08 — Preferensi Saya
- Preferensi personal: bahasa, format tanggal, timezone
- Ganti password
- File: `src/modules/settings/pages/MyPreferencesPage.tsx`
