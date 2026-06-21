# D2 — LineItemsTable

> Tabel line items di dalam form transaksi.
> Dipakai di: Sales Invoice, SO, DO, PO, Vendor Bill, Manual Journal, dst.

---

## Anatomi

```
┌────┬──────────────────┬─────────────┬─────┬──────┬────────┬──────┬────────────┬──┐
│ #  │ Produk           │ Deskripsi   │ Qty │ Sat  │  Harga │ Disc │   Subtotal │× │
├────┼──────────────────┼─────────────┼─────┼──────┼────────┼──────┼────────────┼──┤
│ 1  │ [Tabung Gas 3kg▼]│ [_________] │[100]│[pcs▼]│[18.500]│ [0%] │  1.850.000 │× │
│ 2  │ [Regulator     ▼]│ [_________] │ [10]│[pcs▼]│[65.000]│ [0%] │    650.000 │× │
├────┴──────────────────┴─────────────┴─────┴──────┴────────┴──────┴────────────┴──┤
│  + Tambah Item                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Spesifikasi Tabel

```
wrapper       : overflow-x-auto (horizontal scroll wajib)
table         : min-w-full, border-collapse
bg header     : #eeeeee (sama dengan DataTable)

Header:
  font        : 11px, font-weight 700, uppercase, letter-spacing .04em
  color       : #64748b
  padding     : 7px 10px
  border-bottom: 1px solid #d9e2e5
  text-align  : left (default) | right (qty, harga, subtotal)

Row:
  height      : auto (min 36px)
  border-bottom: 1px solid #f1f5f9
  hover       : bg #f8fbfc (hanya saat editable)
```

---

## Kolom Standar (Sales Invoice)

```
#         : 32px, text-center, color #94a3b8, font 12px
Produk    : min-width 200px, SearchableSelect
Deskripsi : min-width 160px, text input (opsional)
Qty       : width 70px, number input, text-right
Satuan    : width 80px, SearchableSelect size sm
Harga     : width 110px, number input, text-right, tabular-nums
Disc %    : width 70px, number input, text-right
Subtotal  : width 120px, text-right, tabular-nums, read-only, font-weight 500
×         : width 32px, delete button, text-center
```

---

## Cell Input Styling

```
Input dalam tabel:
  border        : 1px solid transparent
  border-radius : 4px
  padding       : 4px 8px
  font          : 13px
  bg            : transparent
  width         : 100%

  hover:
    border-color: #d9e2e5
    bg          : #ffffff

  focus:
    border-color: #5c9ead
    bg          : #ffffff
    box-shadow  : 0 0 0 2px rgba(92,158,173,0.15)
    outline     : none

Number input (qty, harga, disc):
  text-align    : right
  font-variant  : tabular-nums
```

---

## Delete Button (×)

```
width/height  : 24px
border-radius : 4px
bg            : transparent
color         : #cbd5e1
display       : flex items-center justify-content

hover:
  bg          : #fee2e2
  color       : #ef4444

Hanya tampil saat row di-hover (default hidden)
Selalu tampil saat ada error di row
```

---

## Tambah Item Button

```
display       : block
padding       : 10px 0
font          : 13px, font-weight 500
color         : #5c9ead
bg            : transparent
border        : 0

hover:
  color       : #326273

icon          : Plus 14px di kiri
label         : "+ Tambah Item"
```

---

## Read-Only Mode (dokumen posted)

```
Semua cell input  → tampil sebagai text (tidak ada border/bg)
Delete button     → hidden
Tambah Item       → hidden
Row hover effect  → disabled
```

---

## Tracking Info (Sales Order / PO)

```
Di bawah qty cell (untuk dokumen dengan tracking):
  font    : 11px, color #64748b
  content : "Terkirim: 50 / 100 | Diinvoice: 30 / 100"

Tampil hanya jika dokumen sudah ada turunannya.
```

---

## Kalkulasi Otomatis

```
Subtotal per baris = qty × harga × (1 - disc/100)
Update realtime saat field qty/harga/disc berubah
Hasil dikirim ke FormSummary via callback/store
```

---

## Manual Journal — Kolom Berbeda

```
#         : 32px
Akun      : min-width 220px, SearchableSelect (hanya postable account)
Departemen: width 120px, SearchableSelect (opsional)
Proyek    : width 120px, SearchableSelect (opsional)
Deskripsi : min-width 160px, text input
Debit     : width 130px, number input, text-right, tabular-nums
Kredit    : width 130px, number input, text-right, tabular-nums
×         : 32px

Validasi: total Debit harus = total Kredit sebelum Post
Tampilkan di bawah tabel: "Debit: 5.000.000 | Kredit: 5.000.000 ✓"
Jika tidak balance: warna merah, tombol Post disabled
```
