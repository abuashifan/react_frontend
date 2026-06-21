# Design N1 — Fixed Assets List & Form Pages

**Module**: Fixed Assets (`/fixed-assets`)  
**Pattern**: Ikuti pola Sales Invoice (list page + form page terpisah)

---

## N1-A: Fixed Asset List Page (`/fixed-assets`)

### Layout

```
WorkspaceLayout
  title: "Aktiva Tetap"
  action: [+ Tambah Aktiva] (permission: fixed_assets.create)

FilterSidebar (kiri, collapsible)
  - Kategori: SearchableSelect dari /fixed-assets/categories
  - Status: Select [Semua, Aktif, Disposed, Fully Depreciated]
  - Tanggal Perolehan: date range

DataTable (kanan)
  Kolom:
  - Kode Aktiva (sticky, link ke form)
  - Nama Aktiva
  - Kategori
  - Tanggal Perolehan
  - Nilai Perolehan (tabular-nums, right-align)
  - Akumulasi Depresiasi (tabular-nums, right-align)
  - Nilai Buku (tabular-nums, right-align, bold)
  - Status (badge: aktif/disposed/fully_depreciated)
```

### Status Badge Colors

| Status | Color |
|--------|-------|
| aktif | hijau |
| fully_depreciated | amber |
| disposed | abu-abu |

---

## N1-B: Fixed Asset Form Page (`/fixed-assets/create`, `/fixed-assets/:id`)

### Layout

```
FormLayout
  title: "Aktiva Tetap"
  documentNumber: asset_code
  status: status badge
  bottomBar: [Void] [Simpan] atau action buttons tergantung status
```

### Sections

#### 1. Informasi Dasar

```
[Kode Aktiva*]          [Nama Aktiva*]
[Kategori*]             [Lokasi/Gudang]
[Deskripsi - textarea]
```

#### 2. Perolehan

```
[Tanggal Perolehan*]    [Nilai Perolehan*]
[Vendor/Supplier]       [Nomor Referensi PO/Bill]
```

#### 3. Depresiasi

```
[Metode Depresiasi*]    [Masa Manfaat (bulan)*]
[Nilai Residu]          [Tanggal Mulai Depresiasi]
```

**Metode depresiasi**: Select → Straight-line, Declining balance

#### 4. Akun (SearchableSelect COA)

```
[Akun Aktiva*]          [Akun Depresiasi*]
[Akun Akumulasi Dep.*]  [Akun Keuntungan Disposal]
[Akun Kerugian Disposal]
```

#### 5. Status Saat Ini (read-only jika sudah ada data)

```
Nilai Buku Sekarang: Rp X
Akumulasi Depresiasi: Rp X
Sisa Masa Manfaat: X bulan
Depresiasi Bulanan: Rp X
```

---

## N1-C: Capitalize Action

Dialog muncul saat klik tombol "Kapitalisasi" (permission: `fixed_assets.capitalize`).

```
Modal: Kapitalisasi Aktiva
  - Tanggal Kapitalisasi*
  - Deskripsi
  - [Batal] [Proses Kapitalisasi]
```

---

## N1-D: Dispose Action

Dialog muncul saat klik tombol "Lepas/Jual" (permission: `fixed_assets.dispose`).

```
Modal: Pelepasan Aktiva
  - Tanggal Pelepasan*
  - Metode: [Jual] [Dibuang] [Donasi]
  - Harga Jual (jika Jual)
  - Buyer/Penerima (optional)
  - Deskripsi
  - [Batal] [Proses Pelepasan]
```

---

## N1-E: Fixed Asset Category Page (`/fixed-assets/categories`)

Pattern: Dialog-based CRUD (sama seperti SatuanPage, GudangPage).

```
WorkspaceLayout
  title: "Kategori Aktiva Tetap"
  action: [+ Tambah Kategori]

DataTable
  Kolom: Kode, Nama, Metode Default, Masa Manfaat Default, Status

Dialog (create/edit):
  - Kode Kategori*
  - Nama Kategori*
  - Metode Depresiasi Default
  - Masa Manfaat Default (bulan)
  - Akun Aktiva Default (SearchableSelect)
  - Akun Akumulasi Default (SearchableSelect)
```

---

## N1-F: Fixed Asset Report Pages

Semua report pages ikuti pola sama dengan `TrialBalancePage`:
- `ReportFilterParameter` untuk parameter input
- `ReportCompactBar` untuk tampilkan parameter aktif
- Tabel hasil di bawahnya
- Tidak ada export (backend belum ada)

### Register Report (`/fixed-assets/reports/register`)
Tabel: Kode, Nama, Kategori, Tgl Perolehan, Nilai Perolehan, Akum Dep, Nilai Buku, Status

### Depreciation Report (`/fixed-assets/reports/depreciation`)
Filter: periode (bulan)  
Tabel: Kode, Nama, Nilai Buku Awal, Depresiasi Bulan Ini, Nilai Buku Akhir

### Disposals Report (`/fixed-assets/reports/disposals`)
Filter: date range  
Tabel: Kode, Nama, Tgl Disposal, Harga Jual, Nilai Buku Saat Disposal, Gain/Loss

### Reconciliation Report (`/fixed-assets/reports/reconciliation`)
Filter: as_of_date  
Tabel: Kode, Nama, Saldo GL, Nilai Buku, Selisih (highlight merah jika ada)
