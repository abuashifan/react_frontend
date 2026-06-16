# 16 — Reports Module

## Navigasi Laporan

### Ribbon Tab: Laporan
Ketika user klik tab "Laporan" di topbar, ribbon menampilkan kategori laporan:

```
[Laporan Keuangan] [Buku Besar] [Penjualan] [Pembelian] [Piutang] [Hutang] [Persediaan]
```

### Content Area — Grid Card (B2 Pattern)
Klik kategori di ribbon → content area menampilkan grid card sub-laporan dalam kategori tersebut.

```tsx
// Layout grid card
<div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
  {reports.map(report => (
    <ReportCard
      key={report.id}
      title={report.title}
      description={report.description}
      type={report.type}        // 'financial' | 'tabular'
      onClick={() => navigate(`/reports/${report.id}/filter`)}
    />
  ))}
</div>
```

---

## Klasifikasi Laporan

### Financial Statement (Print Preview)
Render sebagai dokumen cetak — hierarki akun, fully expanded.

```
• Neraca (Balance Sheet)
• Laba Rugi (Profit & Loss)
• Arus Kas (Cash Flow)
• Neraca Saldo (Trial Balance)
• Ringkasan Keuangan (Financial Summary)
```

### Tabular Report (Table + Preset Analysis)
Render sebagai table interaktif dengan filter, sort, dan preset analysis.

```
Akuntansi:
• Buku Besar — filter by akun (satu/beberapa/semua)

AR & Piutang:
• AR Aging
• Rekonsiliasi AR

AP & Hutang:
• AP Aging
• Rekonsiliasi AP

Persediaan:
• Saldo Stok
• Mutasi Stok
• Kartu Stok
• Valuasi Inventory
• Rekonsiliasi Inventory
• Low Stock & Negative Stock

Penjualan:
• Daftar Transaksi Penjualan

Pembelian:
• Daftar Transaksi Pembelian
```

---

## Report Flow

```
1. Klik card laporan
   ↓
2. /reports/{reportId}
   Filter page — EXPANDED (full content area)
   Tab: [Parameter] [Filter & Kolom]
   ↓ klik "Tampilkan Laporan"
3. Filter panel COLLAPSE ke compact bar di atas
   ┌──────────────────────────────────────────────────┐
   │ Neraca Standar  Per: 13/06/2026  [▼ Ubah Filter] │
   │ [🖨 Print] [⬇ PDF] [⬇ Excel]                     │
   └──────────────────────────────────────────────────┘
   Laporan tampil penuh di bawah
   ↓ klik [▼ Ubah Filter]
4. Filter panel EXPAND lagi
```

---

## Filter Page — Tab Structure

### Tab 1: Parameter

```
Section: Periode
  Rentang Tanggal: [01/01/2026] s/d [13/06/2026]

Section: Tampilan
  ☐ Tampilkan akun dengan saldo 0
  ☑ Tampilkan akun anak (sub-akun)
  ☑ Tampilkan saldo awal
  ☐ Tampilkan hanya akun aktif di periode ini

Section: Dimensi Analitik
  Departemen: [Semua Departemen ▼]
  Proyek:     [Semua Proyek ▼]
```

### Tab 2: Filter & Kolom

**HARD RULE — Layout wajib diikuti:**

Tiga panel horizontal:

```
┌─────────────────┬──────┬──────────────────────────────┐
│ KOLOM           │  ↑   │ FILTER: Nama Akun            │
│ (listbox)       │  ↓   │                              │
│                 │      │ [filter detail]              │
│ Tanggal     1   │      │                              │
│ Nama Akun   2   │      │                              │
│ No. Sumber  3   │      │                              │
│ Deskripsi   4   │      │                              │
│ Debit       5   │      │                              │
│ Kredit      6   │      │                              │
│ Saldo       7   │      │                              │
│ ─────────────   │      │                              │
│ ☐ Tipe Akun     │      │                              │
│ ☐ Sumber Tx     │      │                              │
└─────────────────┴──────┴──────────────────────────────┘
```

**Behavior panel kiri (listbox):**
- **Checkbox** → kolom tampil/tidak di laporan
- **Klik baris** → baris ter-select (highlight biru muda `#EFF9FB`)
- Selection dan checkbox adalah DUA hal berbeda
- Angka urut di kanan = posisi kolom di laporan (kiri ke kanan)
- Hanya muncul untuk kolom yang dicentang

**Panel tengah (tombol reorder):**
- Tombol ↑ dan ↓ di panel TERPISAH — tidak menempel di baris
- **Aktif** jika ada baris yang di-select DAN kolom tersebut dicentang
- Geser posisi dalam seluruh daftar (bukan hanya antar checked)
- Centered vertikal di panel tengah

**Panel kanan (filter detail):**
Berubah sesuai kolom yang di-select di panel kiri.

Filter type per kolom:

| Tipe Kolom | Filter UI |
|---|---|
| Tanggal | Date range dari/sampai |
| Nama/Teks (search) | Search box + checkbox list hasil |
| Nominal (range) | Input angka dari/sampai |
| Status/Tipe (list) | Checkbox list langsung |

**Sort direction** ada di semua tipe kolom:
```
[▲ A → Z / Terkecil]  [▼ Z → A / Terbesar]
```

**Jika kolom tidak dicentang:**
Panel kanan tampilkan state "Aktifkan kolom ini dulu" dengan background diagonal pattern.

---

## Print Preview Mode

Financial Statement render sebagai print preview — bukan editable table.

```
┌─────────────────────────────────────────┐
│         PT. NAMA PERUSAHAAN             │
│            NERACA SALDO                 │
│         Per 13 Juni 2026                │
├─────────────────────────────────────────┤
│ ASET                                    │
│   Aset Lancar                           │
│     Kas dan Setara Kas     50.000.000   │
│       Kas Kecil            10.000.000   │
│       Bank BCA             40.000.000   │
│   Total Aset Lancar        80.000.000   │
│                                         │
│ Total Aset                 80.000.000   │
├─────────────────────────────────────────┤
│ [Page 1 of 2]                           │
└─────────────────────────────────────────┘
```

**Header laporan (wajib):**
```
Nama Perusahaan
Judul Laporan
Parameter Periode / Tanggal
```

Tidak ada logo, alamat, NPWP — informasi dasar saja.

**Default behavior:**
- Semua level akun ditampilkan (fully expanded)
- Saldo 0 disembunyikan by default (bisa diubah di Parameter)
- Angka selalu `tabular-nums`, right-aligned

---

## Tabular Report

Render sebagai DataTable standar dengan fitur tambahan:

```tsx
<DataTable
  data={reportData}
  columns={reportColumns}   // dinamis dari filter kolom
  isLoading={isLoading}
  // No pagination untuk laporan — tampilkan semua
  // Horizontal scroll enabled
/>
```

**Perbedaan dari workspace list:**
- Tidak ada checkbox kolom
- Tidak ada bulk action
- Tidak ada link ke form dokumen
- Tampilkan semua data (no pagination) — export handle volume besar

---

## Preset Analysis (Tabular Only)

Tab ketiga khusus tabular report. Berisi preset analisis yang sudah didefinisikan:

```tsx
// Preset per laporan
const analysisPresets = {
  'general-ledger': [
    { id: 'by-account',    label: 'Ringkasan per Akun' },
    { id: 'by-month',      label: 'Ringkasan per Bulan' },
    { id: 'by-department', label: 'Ringkasan per Departemen' },
    { id: 'by-project',    label: 'Ringkasan per Proyek' },
  ],
  'sales-transactions': [
    { id: 'by-customer',   label: 'Ringkasan per Customer' },
    { id: 'by-month',      label: 'Ringkasan per Bulan' },
    { id: 'by-status',     label: 'Ringkasan per Status' },
    { id: 'top-10',        label: 'Top 10 Customer by Value' },
  ],
  'ar-aging': [
    { id: 'by-customer',   label: 'Ringkasan per Customer' },
    { id: 'by-age',        label: 'Ringkasan per Umur (0-30, 31-60, 61-90, >90 hari)' },
  ],
  'stock-movements': [
    { id: 'by-product',    label: 'Ringkasan per Produk' },
    { id: 'by-warehouse',  label: 'Ringkasan per Gudang' },
    { id: 'by-month',      label: 'Ringkasan per Bulan' },
    { id: 'by-type',       label: 'Ringkasan per Tipe Movement' },
  ],
}
```

User klik preset → hasil analisis tampil sebagai tabel ringkasan di bawah laporan utama.

---

## Print & Export

Tersedia di semua laporan via compact bar saat laporan ditampilkan:

```
[🖨 Print]  [⬇ Export PDF]  [⬇ Export Excel]
```

| Aksi | Implementasi |
|---|---|
| Print | `window.print()` + CSS `@media print` |
| Export PDF | Server-side — `GET /reports/{id}/export/pdf?{params}` |
| Export Excel | Server-side — `GET /reports/{id}/export/excel?{params}` |

**Export Excel hanya untuk tabular report** — tidak tersedia untuk financial statement.

**Loading state saat export:**
```tsx
// Tombol export menunjukkan loading indicator
<Button disabled={isExporting}>
  {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
  {isExporting ? 'Menyiapkan file...' : 'Export PDF'}
</Button>
```

---

## Buku Besar — Special Case

Buku Besar mendukung filter akun yang fleksibel:

```
Filter Nama Akun di tab Filter & Kolom:
  ☐ Pilih semua → tampilkan semua akun
  ☑ Kas Kecil (1-1001)
  ☑ Bank BCA (1-1002)
  → tampilkan hanya akun yang dipilih
```

Tidak ada "Account Ledger" sebagai laporan terpisah — cukup filter di Buku Besar.
