# design-I2-reports-navigation-structure.md — Reports Module Navigation & Scope Vision

**Status:** Design / Planning — belum diimplementasi  
**Dibuat:** 2026-06-28  
**Diperbarui:** 2026-06-28 (reference tree lengkap)  
**Konteks:** Founding note untuk Phase 36 — direkam dari sesi design review  
**Referensi terkait:**
- `design-I-reports.md` — visual spec reports shell
- `issue-39-phase-36-financial-operational-reports.md` — scope audit findings
- `gap-10-audit-13-remediation-roadmap.md` — roadmap phase

---

## 1. Latar Belakang

Pada sesi design review 2026-06-28, dilakukan perbandingan antara struktur modul laporan Finlite saat ini dengan referensi sistem ERP lain. Referensi tersebut menampilkan sidebar navigasi laporan yang granular dan terorganisir per domain, dengan banyak varian laporan per kategori.

Catatan ini merekam gap yang ditemukan dan keputusan awal tentang arah Phase 36 sebelum implementasi dimulai.

---

## 2. Scope Kategori Referensi — Yang Dipakai vs Skip

Referensi memiliki 19 kategori sidebar. Berikut keputusan per kategori:

| # | Kategori | Keputusan | Alasan |
|---|---|---|---|
| 1 | Laporan Keuangan | ✅ In scope | Core financial reports |
| 2 | Buku Besar | ✅ In scope | Core GL reports |
| 3 | Laporan Penjualan | ✅ In scope | Data ada di backend |
| 4 | Laporan Pembelian | ✅ In scope | Data ada di backend |
| 5 | Akun Piutang dan Pelanggan | ✅ In scope | AR subledger |
| 6 | Akun Hutang dan Pemasok | ✅ In scope | AP subledger |
| 7 | Barang | ✅ In scope | Inventory reports |
| 8 | Pembiayaan Pesanan | ⛔ Skip | Tidak dipakai |
| 9 | Laporan Lainnya | ⛔ Skip | Tidak dipakai |
| 10 | Laporan Audit | ⛔ Skip | Tidak ada list laporan |
| 11 | Aktiva Tetap | ✅ In scope | Backend sudah ada |
| 12 | Laporan Pajak | ✅ In scope | PPN masukan/keluaran |
| 13 | Laporan Departemen | ⛔ Skip | Di luar scope Finlite |
| 14 | Laporan Proyek | ⛔ Skip | Di luar scope Finlite |
| 15 | Laporan Manufaktur | ⛔ Skip | Tidak digunakan |
| 16 | Laporan Tersimpan | 🔖 Khusus | Saved user custom reports — konsep berbeda |
| 17 | Custom Reports | ⛔ Skip | Tidak dipakai |
| 18 | Ekspor Laporan | ✅ In scope | E-Faktur PPN (csv) |
| 19 | Laporan Format Impor | ⛔ Skip | Tidak digunakan |

**Kategori in-scope untuk Finlite: 8 kategori + 1 khusus (Laporan Tersimpan).**

---

## 3. Reference Report Tree (Lengkap)

Status kolom Finlite: ✅ ada · ⚠️ sebagian/beda endpoint · ❌ belum ada · — tidak relevan

---

### 3.1 Buku Besar (17 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Buku Besar - Ringkasan | ⚠️ `/reports/general-ledger` (ringkasan + rincian digabung) |
| 2 | Buku Besar - Rincian | ⚠️ gabung dengan ringkasan |
| 3 | Semua Jurnal | ❌ |
| 4 | Neraca Saldo | ✅ `/reports/trial-balance` |
| 5 | Jurnal Pembelian | ❌ |
| 6 | Jurnal Penjualan | ❌ |
| 7 | Ringkasan Jurnal Umum | ❌ |
| 8 | Bukti Jurnal Umum | ❌ |
| 9 | Pembayaran Lainnya - Ringkasan | ❌ |
| 10 | Pembayaran Lainnya - Rincian | ❌ |
| 11 | Daftar Akun | ❌ (data ada di COA master, bukan laporan) |
| 12 | Daftar Histori Buku Besar | ❌ |
| 13 | Daftar Anggaran Buku Besar | ❌ butuh modul anggaran |
| 14 | Daftar Buku Bank | ❌ |
| 15 | Penerimaan Lainnya - Ringkasan | ❌ |
| 16 | Penerimaan Lainnya - Rincian | ❌ |
| 17 | Jurnal Transaksi | ❌ |

---

### 3.2 Laporan Keuangan (20 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Neraca (Standar) | ✅ `/reports/balance-sheet` |
| 2 | Neraca (Standar) - Cabang | ❌ butuh dimensi cabang |
| 3 | Laba Rugi (Standar) | ✅ `/reports/profit-loss` |
| 4 | Laba Rugi (Standar) - Cabang | ❌ butuh dimensi cabang |
| 5 | Laba Ditahan | ❌ retained earnings |
| 6 | Arus Kas (Metode Langsung) - Rincian | ❌ metode langsung belum ada |
| 7 | Neraca (Induk Skontro) | ❌ format T-account |
| 8 | Neraca (Multi Periode) | ❌ perbandingan antar periode |
| 9 | Neraca (Perbandingan Bulan) | ❌ side-by-side bulanan |
| 10 | Neraca (Perbandingan Anggaran) | ❌ butuh modul anggaran |
| 11 | Neraca (Anggaran Periode) | ❌ butuh modul anggaran |
| 12 | Laba Rugi (Multi Periode) | ❌ perbandingan antar periode |
| 13 | Laba Rugi (Multi Periode NEW) | ❌ |
| 14 | Laba Rugi (Perbandingan Bulan) | ❌ side-by-side bulanan |
| 15 | Laba Rugi (Perbandingan Anggaran) | ❌ butuh modul anggaran |
| 16 | Keuangan - Ringkasan | ✅ `/reports/financial-summary` |
| 17 | Arus Kas (Metode Tidak Langsung) - Ringkasan | ✅ `/reports/cash-flow` |
| 18 | Arus Kas (Metode Tidak Langsung) - Rincian | ❌ breakdown per akun |
| 19 | Perubahan Ekuitas Pemilik | ❌ statement of equity |
| 20 | Arus Kas Terproyek - Rincian | ❌ butuh modul proyeksi |

---

### 3.3 Laporan Penjualan (22 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Daftar Faktur Penjualan | ❌ (ada di modul sales, bukan di /reports/) |
| 2 | Daftar Pengiriman Pesanan | ❌ |
| 3 | Penjualan Per Barang - Omset | ❌ |
| 4 | Daftar Retur Penjualan | ❌ |
| 5 | Penjualan Per Pelanggan - Ringkasan | ⚠️ `/ar/customer-summary` ada tapi bukan di /reports/ |
| 6 | Penjualan Per Pelanggan - Rincian | ❌ |
| 7 | Penjualan Pelanggan Per Barang | ❌ |
| 8 | Penjualan Per Barang - Ringkasan | ❌ |
| 9 | Penjualan Per Barang - Rincian | ❌ |
| 10 | Penjualan Per Barang - Kuantitas | ❌ |
| 11 | Retur Penjualan Per Pelanggan | ❌ |
| 12 | Retur Penjualan Per Barang | ❌ |
| 13 | Rincian Daftar Retur Penjualan | ❌ |
| 14 | Pesanan Penjualan Per Pelanggan | ❌ |
| 15 | Pesanan Penjualan Per Barang | ❌ |
| 16 | Penawaran Penjualan Per Pelanggan | ❌ |
| 17 | Penawaran Penjualan Per Barang | ❌ |
| 18 | Histori Pengiriman Pesanan | ❌ |
| 19 | Histori Pesanan Penjualan | ❌ |
| 20 | Uang Muka Faktur Penjualan | ❌ |
| 21 | Uang Muka Pesanan Penjualan | ❌ |
| 22 | *(Duplikat Penjualan Per Barang - Omset di UI referensi)* | — |

---

### 3.4 Laporan Pembelian (16 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Daftar Faktur Pembelian | ❌ (ada di modul purchase, bukan di /reports/) |
| 2 | Daftar Penerimaan Barang | ❌ |
| 3 | Pembelian Per Pemasok - Ringkasan | ⚠️ `/ap/vendor-summary` ada tapi bukan di /reports/ |
| 4 | Pembelian Per Pemasok - Rincian | ❌ |
| 5 | Daftar Retur Pembelian | ❌ |
| 6 | Pembelian Per Barang - Ringkasan | ❌ |
| 7 | Pembelian Per Barang - Rincian | ❌ |
| 8 | Rincian Daftar Retur Pembelian | ❌ |
| 9 | Pesanan Pembelian Per Pemasok | ❌ |
| 10 | Pesanan Pembelian Per Barang | ❌ |
| 11 | Permintaan Pembelian Per Barang | ❌ |
| 12 | Histori Penerimaan Barang | ❌ |
| 13 | Histori Pesanan Pembelian | ❌ |
| 14 | Uang Muka Faktur Pembelian | ❌ |
| 15 | Uang Muka Pesanan Pembelian | ❌ |
| 16 | *(Duplikat Pembelian Per Pemasok - Ringkasan di UI referensi)* | — |

---

### 3.5 Akun Piutang dan Pelanggan / AR (12 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Daftar Pelanggan | ❌ (ada di master data, bukan laporan) |
| 2 | Penerimaan Pelanggan - Ringkasan | ❌ |
| 3 | Faktur Belum Lunas | ❌ |
| 4 | Penerimaan Pelanggan - Rincian | ❌ |
| 5 | Umur Piutang - Ringkasan | ✅ `/reports/ar-aging` |
| 6 | Umur Piutang - Rincian | ⚠️ dalam halaman yang sama |
| 7 | Umur Piutang - Rincian (New) | ❌ |
| 8 | Buku Besar Pembantu Piutang - Ringkasan | ⚠️ `/ar/customers/{id}/ledger` (per customer, bukan agregat) |
| 9 | Buku Besar Pembantu Piutang - Rincian | ⚠️ `/ar/invoices/{id}/ledger` (per invoice) |
| 10 | Histori Piutang Pelanggan | ❌ |
| 11 | Penerimaan Faktur Ringkasan (new) | ❌ |
| 12 | Penerimaan Faktur Rincian (new) | ❌ |

---

### 3.6 Akun Hutang dan Pemasok / AP (9 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Daftar Pemasok | ❌ (ada di master data, bukan laporan) |
| 2 | Pembayaran Pemasok - Ringkasan | ❌ |
| 3 | Hutang Yang Belum Lunas | ❌ |
| 4 | Umur Hutang - Ringkasan | ✅ `/reports/ap-aging` |
| 5 | Umur Hutang - Rincian | ⚠️ dalam halaman yang sama |
| 6 | Buku Besar Pembantu Hutang - Ringkasan | ⚠️ `/ap/vendors/{id}/ledger` (per vendor, bukan agregat) |
| 7 | Buku Besar Pembantu Hutang - Rincian | ⚠️ `/ap/bills/{id}/ledger` (per bill) |
| 8 | Pembayaran Faktur - Ringkasan (new) | ❌ |
| 9 | Pembayaran Faktur - Rincian (new) | ❌ |

---

### 3.7 Barang / Persediaan (22 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Kartu Stok Persediaan | ✅ `/inventory/reports/stock-card` |
| 2 | Daftar Akun Barang | ❌ |
| 3 | Valuasi Persediaan - Ringkasan | ✅ `/inventory/reports/valuation` |
| 4 | Valuasi Persediaan - Rincian | ⚠️ endpoint sama, belum dipisah |
| 5 | Valuasi Persediaan - FIFO | ❌ Finlite pakai average cost, bukan FIFO |
| 6 | Umur Persediaan - Ringkasan | ❌ |
| 7 | Umur Persediaan - Rincian | ❌ |
| 8 | Kertas Kerja Fisikal Persediaan | ❌ opname worksheet |
| 9 | Status Barang Dan Kertas Kerja Reorder | ❌ |
| 10 | Mutasi Per Barang Per Gudang (New) | ✅ `/inventory/reports/stock-movements` |
| 11 | Mutasi Per Gudang Per Barang | ⚠️ endpoint sama, filter berbeda |
| 12 | Mutasi Per Gudang Per Barang (New) | ⚠️ endpoint sama |
| 13 | Kuantitas Barang Per Gudang (Tabel) | ✅ `/inventory/reports/stock-balances` |
| 14 | Kuantitas Barang Per Gudang | ⚠️ endpoint sama |
| 15 | Daftar Perpindahan Barang - Rincian | ❌ |
| 16 | Nomor Serial/Produksi Masuk | — Finlite tidak ada serial tracking |
| 17 | Nomor Serial/Produksi Keluar | — |
| 18 | Nomor Serial/Produksi Tersedia | — |
| 19 | Nomor Serial/Produksi Per Gudang | — |
| 20 | Nomor Serial/Produksi History | — |
| 21 | Selisih Kuantitas Barang vs Nomor Seri | — |
| 22 | Jurnal Persediaan | ❌ |

---

### 3.8 Aktiva Tetap (3 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Daftar Aktiva Tetap - Ringkasan | ⚠️ `/fixed-assets/reports/register` ada di backend, frontend belum |
| 2 | Daftar Jurnal Aktiva Tetap - Ringkasan | ❌ |
| 3 | Histori Aktiva Tetap | ⚠️ `/fixed-assets/reports/depreciation` (bukan histori, tapi terdekat) |

*Catatan: backend Finlite punya 4 endpoint fixed assets (register, depreciation, disposals, reconciliation) tapi tidak ada satu pun yang punya halaman di frontend.*

---

### 3.9 Laporan Pajak (2 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Daftar PPN Masukan | ❌ belum ada backend maupun frontend |
| 2 | Daftar PPN Keluaran | ❌ belum ada backend maupun frontend |

---

### 3.10 Ekspor Laporan (2 laporan)

| # | Nama Laporan | Finlite |
|---|---|---|
| 1 | Export Penjualan - E-Faktur (csv) | ❌ |
| 2 | Export Pembelian - E-Faktur (csv) | ❌ |

*Catatan: ini bukan laporan standar melainkan export format DJP untuk E-Faktur PPN. Butuh backend khusus.*

---

### 3.11 Kategori Skip / Out of Scope

| Kategori | Alasan |
|---|---|
| Pembiayaan Pesanan | Tidak dipakai |
| Laporan Lainnya | Tidak dipakai |
| Laporan Audit | Tidak ada list laporan |
| Laporan Departemen | Di luar scope Finlite |
| Laporan Proyek | Di luar scope Finlite |
| Laporan Manufaktur | Tidak digunakan |
| Laporan Format Impor | Tidak digunakan |
| Custom Reports | Tidak dipakai |
| Laporan Tersimpan | Konsep berbeda — tempat user menyimpan custom report yang dibuat sendiri; bukan list laporan tetap |

---

## 4. Ringkasan Gap (Reference Tree Lengkap)

| Kategori | Total Ref | ✅ Ada | ⚠️ Sebagian | ❌ Belum | — N/A |
|---|---:|---:|---:|---:|---:|
| Buku Besar | 17 | 1 | 1 | 15 | 0 |
| Laporan Keuangan | 20 | 4 | 0 | 16 | 0 |
| Laporan Penjualan | 22 | 0 | 1 | 20 | 1 |
| Laporan Pembelian | 16 | 0 | 1 | 14 | 1 |
| AR / Akun Piutang | 12 | 1 | 4 | 7 | 0 |
| AP / Akun Hutang | 9 | 1 | 2 | 6 | 0 |
| Barang / Persediaan | 22 | 4 | 4 | 8 | 6 |
| Aktiva Tetap | 3 | 0 | 2 | 1 | 0 |
| Laporan Pajak | 2 | 0 | 0 | 2 | 0 |
| Ekspor E-Faktur | 2 | 0 | 0 | 2 | 0 |
| **Total** | **125** | **11** | **15** | **91** | **8** |

> Dari 125 laporan referensi yang in-scope, Finlite baru cover **~11 penuh** dan **~15 sebagian**. Sisanya **91 belum ada** (8 not applicable karena serial tracking tidak ada di Finlite).

---

## 5. Backend Finlite — Endpoint yang Sudah Ada

```text
# Financial / Accounting
GET /reports/general-ledger
GET /reports/account-ledger/{account}
GET /reports/trial-balance
GET /reports/profit-loss
GET /reports/balance-sheet
GET /reports/cash-flow
GET /reports/financial-summary
GET /reports/reconciliation/ar
GET /reports/reconciliation/ap
GET /reports/reconciliation/inventory
GET /reports/reconciliation/grni
GET /reports/reconciliation/customer-deposits
GET /reports/reconciliation/vendor-deposits

# AR Subledger
GET /ar/aging
GET /ar/customer-summary
GET /ar/customers/{id}/ledger
GET /ar/invoices/{id}/ledger

# AP Subledger
GET /ap/aging
GET /ap/vendor-summary
GET /ap/vendors/{id}/ledger
GET /ap/bills/{id}/ledger
GET /ap/reconciliation

# Cash/Bank
GET /cash-bank/reports/account-statement

# Inventory
GET /inventory/reports/stock-balances
GET /inventory/reports/stock-movements
GET /inventory/reports/stock-card
GET /inventory/reports/valuation
GET /inventory/reports/low-stock
GET /inventory/reports/negative-stock

# Fixed Assets
GET /fixed-assets/reports/register
GET /fixed-assets/reports/depreciation
GET /fixed-assets/reports/disposals
GET /fixed-assets/reports/reconciliation
```

---

## 6. Frontend Finlite Saat Ini (12 halaman)

```text
/reports                    → ReportIndexPage (3 seksi, 11 kartu)
/reports/trial-balance      → Neraca Saldo
/reports/profit-loss        → Laba Rugi
/reports/balance-sheet      → Neraca
/reports/cash-flow          → Arus Kas
/reports/financial-summary  → Ringkasan Keuangan
/reports/general-ledger     → Buku Besar
/reports/ar-aging           → AR Aging
/reports/ap-aging           → AP Aging
/reports/reconciliation     → Rekonsiliasi (AR/AP/Inventory/GRNI/Deposits)
/reports/stock              → Laporan Stok (balance, movements, card)
/reports/inventory-analysis → Analisis Inventori (valuasi, low-stock, negative)
```

---

## 7. Prioritas Penambahan Laporan

### Phase 36 — Fix yang sudah ada (tidak tambah laporan baru)
Sesuai issue-39 (A13-232..253): fix adapter, filter, crash, export.

### Post Phase 36 — Urutan prioritas

**Prioritas A — Backend siap, hanya butuh frontend page:**
- Fixed Assets: Daftar Aset, Depresiasi, Disposals, Rekonsiliasi (4 endpoint siap)
- Kas/Bank: Mutasi Rekening (1 endpoint siap)
- Buku Besar per Akun (endpoint `/reports/account-ledger/{account}` sudah ada)
- AR: Faktur Belum Lunas (query dari sales_invoices status belum lunas)
- AP: Hutang Yang Belum Lunas (query dari vendor_bills)

**Prioritas B — Butuh frontend + backend extension:**
- Laporan Penjualan: agregasi per pelanggan, per barang (query dari sales_invoices + lines)
- Laporan Pembelian: agregasi per pemasok, per barang (query dari vendor_bills + lines)
- Buku Besar: pisah ringkasan vs rincian, tambah jurnal per modul
- Inventory: Kertas Kerja Fisikal dari data opname, Jurnal Persediaan

**Prioritas C — Scope baru, butuh desain + backend baru:**
- Multi-periode (Neraca/L&R perbandingan antar bulan/tahun)
- Laba Ditahan, Perubahan Ekuitas, Arus Kas metode langsung
- Laporan Pajak PPN (Daftar PPN Masukan/Keluaran)
- E-Faktur export (format DJP)
- Umur Persediaan (inventory aging)
- Laporan Tersimpan (saved custom reports)

**Tidak akan diimplementasi:**
- Serial/batch number tracking
- Laporan per Cabang/Departemen/Proyek (di luar scope Finlite)
- Valuasi FIFO (Finlite pakai average cost)
- Modul Anggaran (diperlukan untuk varian perbandingan anggaran)
- Format Impor / E-Faktur import

---

## 8. Kandidat Navigasi Index — Arah Desain

### Saat ini (flat 3 seksi)
```text
[Laporan Keuangan]       [Buku Besar & Subledger]   [Persediaan]
  Neraca Saldo             Buku Besar                  Laporan Stok
  Laba Rugi                AR Aging                    Analisis Inventori
  Neraca                   AP Aging
  Arus Kas                 Rekonsiliasi
  Ringkasan Keuangan
```

### Kandidat arah — sidebar per domain
```text
Sidebar                      Isi (target state)
────────────────────────     ──────────────────────────────────────────────────
Laporan Keuangan         →   Neraca · Laba Rugi · Arus Kas · Ringkasan
Buku Besar               →   Buku Besar · Neraca Saldo · Buku Besar per Akun
Laporan Penjualan        →   Per Pelanggan · Per Barang · Retur · Uang Muka
Laporan Pembelian        →   Per Pemasok · Per Barang · Retur · Uang Muka
Akun Piutang (AR)        →   AR Aging · Faktur Belum Lunas · Customer Summary
Akun Hutang (AP)         →   AP Aging · Hutang Belum Lunas · Vendor Summary
Rekonsiliasi             →   AR · AP · Inventory · GRNI · Deposits
Persediaan               →   Kartu Stok · Mutasi · Saldo · Valuasi · Analisis
Aktiva Tetap             →   Daftar Aset · Depresiasi · Disposals · Rekonsiliasi
Kas & Bank               →   Mutasi Rekening
Laporan Pajak            →   PPN Masukan · PPN Keluaran  (Prioritas C)
```

> Perubahan navigasi ini adalah **frontend-only** untuk sebagian besar item, dan bisa dilakukan terpisah dari perbaikan adapter Phase 36.

---

## 9. Catatan Implementasi

- Jangan ubah navigasi sebelum adapter dan filter semua laporan yang ada stabil (Phase 36 selesai).
- Fixed assets reports adalah **quick win terbaik** — 4 backend endpoint sudah siap, hanya butuh frontend page.
- Laporan Penjualan/Pembelian yang dimaksud adalah laporan **agregasi** (per pelanggan/barang), bukan daftar transaksi — butuh endpoint baru di backend.
- Multi-periode butuh diskusi API contract — backend saat ini mengembalikan satu periode per request.
- PPN Masukan/Keluaran butuh backend baru yang membaca dari journal entries yang tagged sebagai tax.
- E-Faktur export (csv DJP) butuh format khusus, berbeda dari export laporan biasa.
- Serial/batch tracking tidak relevan — Finlite tidak punya modul itu.
- Laporan Tersimpan adalah konsep UX (user menyimpan filter/config laporan), bukan list laporan tetap — desain tersendiri dibutuhkan.
