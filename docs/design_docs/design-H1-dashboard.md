# H1 — Dashboard

> Halaman pertama setelah login. Menjawab: "Apa yang perlu aku perhatikan hari ini?"

---

## Layout Grid

```
┌─────────────────────────────────────────────────────────────┐
│  Section 1 — KPI Cards (4 kolom)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Piutang  │ │ Hutang   │ │Kas & Bank│ │Laba Bln  │      │
│  │ 84,2 jt  │ │ 32,5 jt  │ │ 120,4 jt │ │ 12,3 jt  │      │
│  │ ↑ 12%    │ │ ↓ 5%     │ │          │ │ ↑ 8%     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Section 2 — Dokumen Pending                                │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ ⚠ 5 Invoice jatuh   │ │ ⚠ 3 Tagihan menunggu │          │
│  │   tempo             │ │   pembayaran         │          │
│  └─────────────────────┘ └─────────────────────┘           │
├───────────────────────────┬─────────────────────────────────┤
│  Section 3 — Grafik       │                                 │
│  Penjualan vs Pembelian   │  Arus Kas                       │
│  [LineChart 6 bulan]      │  [BarChart 3 bulan]             │
├───────────────────────────┴─────────────────────────────────┤
│  Section 4 — Aktivitas Terbaru                              │
│  INV-001  PT Maju Jaya  Rp 18.500.000  Posted  2 jam lalu  │
│  PO-005   CV Surya      Rp  9.200.000  Draft   3 jam lalu  │
└─────────────────────────────────────────────────────────────┘
```

---

## Section 1 — KPI Cards

```
Grid: 2 kolom (mobile) | 4 kolom (lg 1024px+)
Gap: 12px

Card specs:
  bg            : #ffffff
  border        : 1px solid #d9e2e5
  border-radius : 10px
  padding       : 16px
  min-height    : 96px

  Header row (flex justify-between):
    Label       : 11px, font-weight 700, uppercase, letter-spacing .04em, color #64748b
    Icon wrapper: 32x32px, border-radius 8px, icon 16px

    Warna icon wrapper per card:
      Piutang   : bg #EFF9FB, icon color #5c9ead   (TrendingUp)
      Hutang    : bg #fef2f2, icon color #ef4444   (TrendingDown)
      Kas & Bank: bg #EFF9FB, icon color #5c9ead   (Wallet)
      Laba      : bg #f0fdf4, icon color #16a34a   (BarChart2)
                  atau bg #fef2f2, color #ef4444 jika rugi

  Value:
    font        : 22px, font-weight 700, tabular-nums, color #24323a
    margin-top  : 8px

  Trend (opsional):
    font        : 12px
    ↑ positif   : color #065F46, "↑ 12% vs bulan lalu"
    ↓ negatif   : color #991B1B, "↓ 5% vs bulan lalu"
    margin-top  : 4px

Loading skeleton:
  h-3 w-20 (label) | h-8 w-32 (value) | h-3 w-24 (trend)
```

---

## Section 2 — Dokumen Pending

```
Grid: 1 kolom (mobile) | 2 kolom (md 768px+)
Gap: 10px
margin-top: 16px

Alert card specs:
  display       : flex items-center justify-between
  padding       : 12px 14px
  border        : 1px solid
  border-radius : 8px
  cursor        : pointer (navigate ke list page)
  transition    : opacity .15s
  hover opacity : 0.8

  Tipe warning (invoice jatuh tempo, stok rendah):
    bg          : #fffbeb | border-color #fde68a
    icon color  : #d97706
    text color  : #92400e

  Tipe danger (sangat terlambat):
    bg          : #fef2f2 | border-color #fecaca
    icon color  : #dc2626
    text color  : #991B1B

  Tipe info (notifikasi periode):
    bg          : #EFF9FB | border-color #d9e2e5
    icon color  : #5c9ead
    text color  : #326273

  Kiri: Icon 16px + label text 13px font-weight 500
  Kanan: count badge (font-weight 700, tabular-nums) + ChevronRight 14px
```

---

## Section 3 — Grafik

```
Grid: 1 kolom (mobile) | 2 kolom (lg 1024px+)
Gap: 12px
margin-top: 16px

Chart card:
  bg            : #ffffff
  border        : 1px solid #d9e2e5
  border-radius : 10px
  padding       : 16px

  Title: 13px, font-weight 600, color #24323a
  Subtitle: 11px, color #64748b, margin-top 2px
  Chart area: margin-top 12px, height 200px

Penjualan vs Pembelian (LineChart, Recharts):
  X-axis: nama bulan pendek (Jan, Feb, ...) | font 11px | color #64748b
  Y-axis: nilai disingkat (84jt) | font 11px | color #64748b
  Grid: strokeDasharray "3 3" | stroke #d9e2e5
  Tooltip: border #d9e2e5 | font 12px | format Rupiah
  Legend: font 12px

  Line Penjualan : stroke #5c9ead, strokeWidth 2, dot false
  Line Pembelian : stroke #e39774, strokeWidth 2, dot false

Arus Kas (BarChart, Recharts):
  X-axis: nama bulan | Y-axis: nilai disingkat
  Bar Penerimaan : fill #5c9ead, radius [3,3,0,0]
  Bar Pengeluaran: fill #e39774, radius [3,3,0,0]
```

---

## Section 4 — Aktivitas Terbaru

```
margin-top    : 16px
bg            : #ffffff
border        : 1px solid #d9e2e5
border-radius : 10px

Header:
  padding     : 14px 16px
  border-bottom: 1px solid #d9e2e5
  display     : flex justify-between
  title       : "Aktivitas Terbaru" — 13px, font-weight 600
  subtitle    : "10 transaksi terakhir" — 11px, color #64748b

List item (klik → navigate ke dokumen):
  display     : flex items-center gap-12px
  padding     : 12px 16px
  border-bottom: 1px solid #f1f5f9
  hover bg    : #f8fbfc

  Icon wrapper: 32x32px, border-radius 8px
    Warna bg sesuai tipe dokumen:
      Sales   : bg #EFF9FB, icon color #5c9ead
      Purchase: bg #fef9ec, icon color #d97706
      Inventory: bg #f0fdf4, icon color #16a34a
      Accounting: bg #f5f3ff, icon color #7c3aed

  Info (flex-1):
    Nomor dokumen: 13px, font-weight 500, color #24323a
    Nama pihak   : 11px, color #64748b, margin-top 2px

  Amount: 13px, tabular-nums, font-weight 500, text-right, color #24323a
  Waktu : 11px, color #94a3b8, text-right, margin-top 2px

  StatusBadge: di kanan, size sm

Last item: border-bottom: 0
```

---

## Content Padding

```
Dashboard tidak ada filter sidebar dan ribbon.
content padding-top: 52 (topbar) + 36 (primary tabs) + 32 (secondary tabs) + 16 = 136px
content padding: 16px 24px
max-width: 1180px, margin: 0 auto
```
