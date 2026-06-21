# D1 — Form Layout

> Komposisi lengkap halaman form dokumen transaksi.
> Berlaku untuk: Sales Invoice, Sales Order, Vendor Bill, PO, dsb.

---

## Anatomi Lengkap

```
┌─────────────────────────────────────────────────────────────┐
│  [Secondary Tab: Daftar] [INV-001 ×] ← active              │  secondary tabs
├─────────────────────────────────────────────────────────────┤
│  [🔒 DocumentLockedBanner — jika terkunci]                  │  optional
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SECTION: Informasi Dokumen                          │   │  FormSection
│  │  [Customer*     ▼] [Tanggal*   📅]                  │   │
│  │  [Due Date*     📅] [Syarat Bayar ▼]                │   │
│  │  [Catatan                              ] ← span 2   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SECTION: Item                                       │   │  LineItemsTable
│  │  # │ Produk │ Qty │ Sat │ Harga │ Disc │ Subtotal │×│  │
│  │  1 │ [___] │ [_] │ [_] │ [___] │ [__] │ 1.850.000│×│  │
│  │  2 │ [___] │ [_] │ [_] │ [___] │ [__] │   650.000│×│  │
│  │  + Tambah Item                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                        ┌──┐ │
│                               Subtotal    2.500.000    │  │ │  FormSummary
│                               Diskon              0    │  │ │
│                               Pajak (11%)   275.000    │  │ │
│                               ─────────────────────    │  │ │
│                               Grand Total  2.775.000   └──┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  INV-2026-001 · Draft          [Batal] [Simpan] [Post]     │  FixedBottomBar
└─────────────────────────────────────────────────────────────┘
```

---

## Content Area Specs

```
padding       : 16px 24px (content area)
padding-bottom: 56px + 16px = 72px (untuk bottom bar)
max-width     : tidak dibatasi (full width, sidebar hidden di form view)
gap antar section: 12px
```

---

## DocumentLockedBanner (Opsional)

```
Tampil   : di atas semua section, jika dokumen locked
bg       : #fffbeb (amber-50)
border   : 1px solid #fde68a
border-radius: 8px
padding  : 12px 16px
margin-bottom: 12px

Icon     : Lock 16px, color #92400e
Title    : "Dokumen ini terkunci." — 13px, font-weight 600, color #92400e
Body     : "Void transaksi berikut terlebih dahulu..."
           12px, color #92400e, margin-top 4px

Link ke dokumen dependen:
  "· INV-001 (Sales Invoice) — Posted  [Lihat →]"
  font: 12px | color #5c9ead | hover underline
  display: block per item | margin-top 4px
```

---

## FormSection

```
bg            : #ffffff
border        : 1px solid #d9e2e5
border-radius : 10px
padding       : 16px 20px (desktop) | 14px 16px (tablet)

Section title:
  font        : 13px, font-weight 600, color #24323a
  padding-bottom: 12px
  border-bottom : 1px solid #d9e2e5
  margin-bottom : 14px

Grid (default 2 kolom):
  grid-cols   : 1 (mobile) | 2 (md 768px+)
  gap         : 14px (tablet) | 16px (desktop)
```

---

## Field dalam FormSection

```
Label:
  font        : 11px, font-weight 600, color #64748b
  text-transform: uppercase
  letter-spacing: .04em
  margin-bottom : 5px
  required (*) : color #ef4444, margin-left 2px

Input/Select:
  height      : 36px
  border      : 1px solid #d9e2e5
  border-radius: 6px
  padding     : 0 10px
  font        : 14px
  color       : #24323a
  focus       : border #5c9ead, shadow 0 0 0 3px rgba(92,158,173,0.12)

Read-only:
  bg          : #f8fbfc
  color       : #64748b
  cursor      : not-allowed
  JANGAN hidden — tetap tampil

Error:
  border-color: #ef4444
  error text  : 12px, color #ef4444, margin-top 4px

Full width (span 2 kolom):
  className="md:col-span-2"
  Berlaku untuk: Notes/Catatan, Deskripsi, Alamat
```

---

## Read-Only Mode (dokumen posted/void)

```
Semua field    : disabled, bg #f8fbfc
LineItemsTable : tidak ada tombol delete/add
FixedBottomBar : tidak tampil (kecuali ada tombol Void)
```
