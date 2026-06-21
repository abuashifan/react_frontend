# C1 — DataTable

> Komponen base untuk semua list/workspace view.
> JANGAN buat table custom — selalu pakai DataTable ini.

---

## Anatomi

```
┌─────────────────────────────────────────────────────────────────┐
│  [BulkActionBar — muncul saat ada row selected]                 │
├──┬────────────┬────────────┬──────────┬────────────┬────────────┤
│☐ │ No. Dokumen│ Nama/Pihak │ Tanggal  │  Status    │   Total    │
│  │ (sticky)   │ (sticky)   │          │            │            │
├──┼────────────┼────────────┼──────────┼────────────┼────────────┤
│☐ │ INV-001    │ PT Maju    │14 Jun 26 │ [Posted]   │ 18.500.000 │
│☐ │ INV-002    │ CV Surya   │13 Jun 26 │ [Approved] │  9.750.000 │
│☐ │ INV-003    │ Toko Berkah│12 Jun 26 │ [Draft]    │  4.300.000 │
├──┴────────────┴────────────┴──────────┴────────────┴────────────┤
│  Menampilkan 1–25 dari 143  [25▼]  [‹] [1] [2] [3]...[6] [›]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Spesifikasi Tabel

```
wrapper       : overflow-x-auto (horizontal scroll)
table         : min-w-full, border-collapse
bg            : #ffffff
border-radius : 10px (wrapper)
border        : 1px solid #d9e2e5

Row height:
  tablet 768px+ : 36px (h-9)
  desktop 1024+ : 40px (h-10)

Cell padding:
  tablet : 8px 12px
  desktop: 10px 16px
```

---

## Header Row

```
bg            : #eeeeee (soft token)
font          : 11px, font-weight 700, uppercase, letter-spacing .04em
color         : #64748b
border-bottom : 1px solid #d9e2e5
height        : 36px
```

---

## Kolom Checkbox (Pertama, Sticky)

```
width         : 32px (w-8)
position      : sticky left-0 z-20
bg            : inherit (ikuti row — header #eeeeee, body #ffffff, hover #f8fbfc)
padding       : 0 8px
border-right  : 1px solid #d9e2e5 (shadow separator saat scroll)
```

---

## Kolom Nomor Dokumen (Kedua, Sticky)

```
min-width     : 140px
position      : sticky left-[32px] z-20
bg            : inherit
font          : 13px, font-weight 600
color         : #5c9ead (link style)
hover         : color #326273, text-decoration underline
cursor        : pointer
```

---

## Body Row States

```
DEFAULT  → bg #ffffff
HOVER    → bg #f8fbfc
SELECTED → bg #EFF9FB | border-left 2px solid #5c9ead
```

---

## Kolom Amount / Angka

```
text-align    : right
font          : tabular-nums, 13px, font-weight 500
color         : #24323a
```

---

## Kolom Tanggal

```
font          : 13px
color         : #64748b
format        : "14 Jun 2026" (bukan ISO)
```

---

## Kolom Status

```
Gunakan DocumentStatusBadge — lihat design tokens untuk warna
size          : sm (di dalam tabel)
```

---

## Loading State — Skeleton Rows

```
Tampilkan N skeleton rows sesuai pageSize
Setiap row: tinggi sama dengan row normal

Skeleton per cell:
  checkbox  : 14x14px rounded
  text      : h-4, lebar bervariasi (w-24 / w-32 / w-20)
  status    : h-5 w-16 rounded-full
  amount    : h-4 w-24 ml-auto
```

---

## Empty State

```
Tampil di dalam tabel (colspan = semua kolom)
padding-top/bottom : 64px
text-align         : center
Gunakan komponen EmptyState → lihat E4
```

---

## Bulk Action Bar

```
Muncul     : slide-down animasi saat selectedCount > 0
Hilang     : slide-up saat selectedCount === 0
Position   : di atas tabel (bukan overlay)
Height     : 40px
bg         : #EFF9FB
border     : 1px solid #5c9ead
border-radius: 8px
margin-bottom: 8px
padding    : 0 16px
display    : flex items-center gap-3

Kiri:
  "{N} item dipilih" — 13px, color #326273, font-weight 500
  "Batalkan pilihan" — 12px, color #64748b, hover color #24323a (text button)

Kanan:
  Action buttons (variant outline atau destructive, size sm)
  Wrap dengan PermissionGuard per button
```

---

## Pagination

```
Position   : di bawah tabel
Height     : 44px
padding    : 0 16px
display    : flex items-center justify-between

Kiri:
  "Menampilkan 1–25 dari 143 data"
  font: 13px, color #64748b

Kanan:
  Page size select: [25▼] options: 25, 50, 100
  Tombol: [‹ Prev] [1] [2] [3] ... [6] [Next ›]

Tombol page:
  size      : 28x28px
  font      : 13px
  active    : bg #326273, color white, border-radius 6px
  default   : bg transparent, color #64748b
  hover     : bg #f1f5f9, color #326273
  disabled  : opacity 40%, cursor not-allowed
```

---

## Minimum Column Widths

```
Checkbox        : 32px
Nomor dokumen   : 140px
Nama/pihak      : 180px
Tanggal         : 100px
Status          : 110px
Amount/angka    : 130px
```
