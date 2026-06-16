# Phase 6 — Accounting & Reports

**Label:** `accounting`, `reports`
**Status:** ⏳ Belum dimulai (tunggu Phase 3, 4, 5 selesai)
**Verifikasi:** Semua laporan tampil dengan data benar. Export PDF dan Excel berfungsi.
**Commit:** `feat(accounting): complete phase 6 — accounting, cash bank, reports`

---

## Sub-phase 6A — Manual Journal & Accounting

### ISSUE-6A-01 — Manual Journal List Page
- Kolom: nomor jurnal, tanggal, deskripsi, total debit, total kredit, status
- Filter sidebar: status, tanggal, akun
- File: `src/modules/accounting/pages/JournalListPage.tsx`

### ISSUE-6A-02 — Manual Journal Form Page
- Header: tanggal, referensi, deskripsi
- Line items: akun (SearchableSelect, bukan parent/header), departemen, proyek, debit, kredit
- Validasi: total debit harus = total kredit sebelum bisa post
- Control account blocked (tidak bisa dipilih manual)
- Actions: Simpan Draft, Post, Void
- File: `src/modules/accounting/pages/JournalFormPage.tsx`

### ISSUE-6A-03 — Fiscal Year Management
- List tahun fiskal: periode, status (open/closed)
- Form: buat tahun fiskal baru, tutup tahun (annual closing)
- File: `src/modules/accounting/pages/FiscalYearPage.tsx`

### ISSUE-6A-04 — Period Lock
- Toggle lock per periode akuntansi
- Saat locked: semua posting di periode tersebut diblokir
- Warning jika ada transaksi draft di periode yang akan dikunci
- File: `src/modules/accounting/pages/PeriodLockPage.tsx`

---

## Sub-phase 6B — Cash & Bank

### ISSUE-6B-01 — Cash Receipt List & Form
- List: nomor, tanggal, akun kas, jumlah, deskripsi, status
- Form: tanggal, akun kas, jumlah, akun lawan, deskripsi, referensi
- Actions: Post, Void
- File: `src/modules/cash-bank/pages/CashReceiptPage.tsx`

### ISSUE-6B-02 — Cash Payment List & Form
- List: nomor, tanggal, akun kas, jumlah, deskripsi, status
- Form: tanggal, akun kas, jumlah, akun lawan, deskripsi, referensi
- Actions: Post, Void
- File: `src/modules/cash-bank/pages/CashPaymentPage.tsx`

### ISSUE-6B-03 — Bank Transfer List & Form
- List: nomor, tanggal, dari akun, ke akun, jumlah, status
- Form: tanggal, akun asal (bank/kas), akun tujuan (bank/kas), jumlah, deskripsi
- Actions: Post, Void
- File: `src/modules/cash-bank/pages/BankTransferPage.tsx`

### ISSUE-6B-04 — Bank Reconciliation List & Form
- List: akun bank, periode, status rekonsiliasi
- Form: pilih akun bank, periode, input saldo statement
- Match transaksi sistem vs statement bank
- Actions: Finalize, Void
- File: `src/modules/cash-bank/pages/BankReconciliationPage.tsx`

---

## Sub-phase 6C — Report Infrastructure

### ISSUE-6C-01 — Report navigation (ribbon + grid card)
- Ribbon: Laporan Keuangan, Buku Besar, Penjualan, Pembelian, Piutang, Hutang, Persediaan
- Content: grid card sub-laporan per kategori
- File: `src/modules/reports/pages/ReportIndexPage.tsx`

### ISSUE-6C-02 — Report Filter Page — Tab Parameter
- Tab pertama saat buka laporan
- Fields: rentang tanggal, dimensi analitik (departemen, proyek)
- Options tampilan: saldo 0, akun anak, saldo awal
- File: `src/modules/reports/components/ReportFilterParameter.tsx`

### ISSUE-6C-03 — Report Filter Page — Tab Filter & Kolom
- 3 panel horizontal: daftar kolom (listbox) + reorder (↑↓) + filter detail per kolom
- Kolom bisa diaktifkan/nonaktifkan + diurutkan
- Filter per tipe kolom: date range, search text, nominal range, checkbox list
- File: `src/modules/reports/components/ReportFilterColumns.tsx`

### ISSUE-6C-04 — Filter collapse → compact bar
- Saat klik "Tampilkan Laporan", filter page collapse jadi compact bar di atas
- Compact bar: nama preset + parameter aktif + tombol "Ubah Filter"
- Klik "Ubah Filter" → expand kembali ke filter page
- File: `src/modules/reports/components/ReportCompactBar.tsx`

### ISSUE-6C-05 — Print CSS @media print
- Semua elemen UI (topbar, ribbon, sidebar, action bar) disembunyikan saat print
- Hanya konten laporan yang tercetak
- Setup di `src/index.css`

### ISSUE-6C-06 — Export PDF (server-side)
- Tombol "⬇ PDF" → panggil API export PDF
- Handle loading state + download otomatis file
- File: `src/modules/reports/hooks/useReportExport.ts`

### ISSUE-6C-07 — Export Excel (server-side)
- Tombol "⬇ Excel" → panggil API export Excel
- Handle loading state + download otomatis file

---

## Sub-phase 6D — Financial Statement Reports

### ISSUE-6D-01 — Neraca (Balance Sheet)
- Renderer print preview: hierarki akun Aset, Kewajiban, Ekuitas
- Header: nama company, judul, per tanggal
- File: `src/modules/reports/pages/BalanceSheetPage.tsx`

### ISSUE-6D-02 — Laba Rugi (P&L)
- Renderer: Pendapatan, HPP, Beban Operasional, Laba Bersih
- File: `src/modules/reports/pages/ProfitLossPage.tsx`

### ISSUE-6D-03 — Arus Kas (Cash Flow)
- Renderer: Operasi, Investasi, Pendanaan
- File: `src/modules/reports/pages/CashFlowPage.tsx`

### ISSUE-6D-04 — Neraca Saldo (Trial Balance)
- Renderer tabel: kode akun, nama, saldo debit, saldo kredit
- File: `src/modules/reports/pages/TrialBalancePage.tsx`

### ISSUE-6D-05 — Ringkasan Keuangan (Financial Summary)
- Dashboard angka kunci: total aset, total kewajiban, ekuitas, pendapatan, laba
- File: `src/modules/reports/pages/FinancialSummaryPage.tsx`

---

## Sub-phase 6E — Tabular Reports

### ISSUE-6E-01 — Buku Besar
- Filter: pilih akun (satu/beberapa/semua), rentang tanggal
- Kolom: tanggal, nomor jurnal, deskripsi, debit, kredit, saldo
- File: `src/modules/reports/pages/GeneralLedgerPage.tsx`

### ISSUE-6E-02 — AR Aging Report
- Tabel aging: current, 1-30, 31-60, 61-90, >90 per customer
- File: `src/modules/reports/pages/ArAgingReportPage.tsx`

### ISSUE-6E-03 — AP Aging Report
- Tabel aging: current, 1-30, 31-60, 61-90, >90 per vendor
- File: `src/modules/reports/pages/ApAgingReportPage.tsx`

### ISSUE-6E-04 — Rekonsiliasi AR, AP, Inventory
- Bandingkan saldo buku besar vs saldo subledger
- Tampilkan selisih jika ada
- File: `src/modules/reports/pages/ReconciliationPage.tsx`

### ISSUE-6E-05 — Laporan Stok (Saldo, Mutasi, Kartu Stok)
- Saldo Stok: qty on hand per produk per gudang
- Mutasi Stok: history movement per periode
- Kartu Stok: saldo berjalan per produk per gudang
- File: `src/modules/reports/pages/StockReportPage.tsx`

### ISSUE-6E-06 — Valuasi Inventory, Low Stock, Negative Stock
- Valuasi: qty × harga rata-rata per produk
- Low Stock: produk di bawah minimum stock
- Negative Stock: produk dengan qty < 0
- File: `src/modules/reports/pages/InventoryAnalysisPage.tsx`

### ISSUE-6E-07 — Daftar Transaksi Penjualan & Pembelian
- Sales: list invoice dengan filter customer, periode, status
- Purchase: list bill dengan filter vendor, periode, status
- File: `src/modules/reports/pages/TransactionListPage.tsx`

### ISSUE-6E-08 — Preset Analysis per laporan
- Simpan kombinasi filter + kolom sebagai preset
- Load preset — restore semua setting filter dan kolom
- File: `src/modules/reports/components/ReportPresetManager.tsx`
