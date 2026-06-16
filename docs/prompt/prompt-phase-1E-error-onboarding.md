# Phase 1E — Error Pages & Onboarding

**Label:** `ui-component`, `onboarding`
**Status:** ⚠️ Belum bersih (Step4MasterData.tsx + onboardingApi.ts masih build error)
**Verifikasi:** Semua error page tampil. Wizard bisa navigasi antar step.
**Commit:** `feat(onboarding): error pages, onboarding wizard 6 steps`

---

## Issues

### ISSUE-1E-01 — Halaman 403 (Forbidden)
- Tampil jika user tidak punya permission
- Pesan: "Anda tidak memiliki akses ke halaman ini"
- Tombol: Kembali ke Dashboard
- File: `src/modules/error/pages/ForbiddenPage.tsx`

### ISSUE-1E-02 — Halaman 404 (Not Found)
- Tampil untuk route yang tidak ditemukan
- Pesan: "Halaman tidak ditemukan"
- Tombol: Kembali ke Dashboard
- File: `src/modules/error/pages/NotFoundPage.tsx`

### ISSUE-1E-03 — Halaman 500 (Server Error)
- Tampil jika API mengembalikan 500
- Pesan: "Terjadi kesalahan pada server"
- Tombol: Coba lagi / Kembali ke Dashboard
- File: `src/modules/error/pages/ServerErrorPage.tsx`

### ISSUE-1E-04 — Halaman Network Error
- Tampil jika request gagal karena jaringan (no connection, timeout)
- Pesan: "Periksa koneksi internet Anda"
- Tombol: Coba lagi
- File: `src/modules/error/pages/NetworkErrorPage.tsx`

### ISSUE-1E-05 — Halaman Maintenance
- Tampil saat app dalam mode maintenance
- File: `src/modules/error/pages/MaintenancePage.tsx`

### ISSUE-1E-06 — ErrorBoundary component
- React class component untuk catch runtime error
- Tampilkan fallback UI saat terjadi uncaught error
- Log error ke console (dan opsional ke service monitoring)
- File: `src/components/shared/feedback/ErrorBoundary.tsx`

### ISSUE-1E-07 — Onboarding Wizard layout
- Route: `/onboarding`
- Layout: sidebar vertikal 6 step (kiri) + konten step aktif (kanan) + navigasi Kembali/Lanjutkan (bawah)
- Step status: completed ✅, active ▶, pending ○, incomplete ⚠️
- Aturan navigasi: hanya bisa ke step yang sudah dikunjungi atau step aktif, tidak bisa skip
- Warning jika ganti template COA (reset Account Mapping)
- File: `src/modules/onboarding/pages/OnboardingPage.tsx`

### ISSUE-1E-08 — Step 1 — Informasi Perusahaan
- Fields: nama perusahaan (required), NPWP, alamat, bulan mulai tahun fiskal (required), mata uang (default IDR)
- Layout 2 kolom, alamat full width
- Validasi Zod sebelum lanjut ke step 2
- API: `PATCH /api/companies/{id}` untuk simpan

### ISSUE-1E-09 — Step 2 — Pilih Template COA
- Grid card template: Agen Gas (45 akun), Perdagangan Umum (52), Jasa (38), Manufaktur (68), Kosong
- Klik card → expand preview tree COA di bawah grid
- Warning dialog jika ganti template setelah Step 3 sudah diisi
- API: `GET /api/coa-templates`, `POST /api/companies/{id}/apply-coa-template`

### ISSUE-1E-10 — Step 3 — Account Mapping
- Pre-filled dari template COA yang dipilih
- Setiap mapping: label → SearchableSelect COA
- Validasi: semua mapping required harus terisi sebelum lanjut
- API: `GET /api/account-mappings`, `PUT /api/account-mappings`

### ISSUE-1E-11 — Step 4 — Master Data Dasar
- Tambah minimal 1 item per kategori sebelum bisa lanjut
- Gudang: fields name, address
- Satuan: fields name, symbol
- Syarat Pembayaran: fields name, days
- Komponen `MasterDataQuickAdd` per kategori
- ⚠️ **Ada build error** di Step4MasterData.tsx — perlu di-fix

### ISSUE-1E-12 — Step 5 — Opening Balance
- Bisa di-skip ("Lewati, isi nanti →")
- Field: tanggal opening balance
- Tabel input saldo per akun — hanya akun yang bisa di-post (bukan parent)
- API: `POST /api/opening-balances`

### ISSUE-1E-13 — Step 6 — Selesai
- Tampilkan ringkasan setup: template COA, account mapping status, jumlah gudang, status opening balance
- Tombol "Mulai Gunakan Seaside Escape →" → `navigate('/')`
- Tombol "Kembali/Ke Dashboard" di error pages juga harus `navigate('/')`, bukan `navigate('/dashboard')`
- Mark onboarding selesai di backend: `POST /api/companies/{id}/complete-onboarding`
