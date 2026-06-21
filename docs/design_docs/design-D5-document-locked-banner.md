# D5 — DocumentLockedBanner

> Banner informatif saat dokumen terkunci karena ada turunan yang sudah posted.

---

## Anatomi

```
┌──────────────────────────────────────────────────────────┐
│ 🔒  Dokumen ini terkunci.                                │
│     Void transaksi berikut terlebih dahulu               │
│     (dari hilir ke hulu):                                │
│                                                          │
│     · RCP-2026-010 (Penerimaan) — Posted   [Lihat →]    │
│     · INV-2026-001 (Sales Invoice) — Posted [Lihat →]   │
└──────────────────────────────────────────────────────────┘
```

---

## Spesifikasi

```
bg            : #fffbeb (amber-50)
border        : 1px solid #fde68a
border-radius : 8px
padding       : 12px 16px
margin-bottom : 12px
display       : flex gap-10px

Icon Lock:
  size        : 16px
  color       : #92400e
  flex-shrink : 0
  margin-top  : 2px (align dengan baris pertama)

Konten kanan:
  Title: "Dokumen ini terkunci."
    font: 13px, font-weight 600, color #92400e

  Subtitle: "Void transaksi berikut terlebih dahulu (dari hilir ke hulu):"
    font: 12px, color #92400e, margin-top 2px

  List dependence (margin-top 8px):
    per item  : "· {nomor} ({tipe}) — {status}   [Lihat →]"
    font      : 12px, color #92400e
    gap       : 4px antar item

    Link [Lihat →]:
      color   : #5c9ead
      hover   : underline
      font    : 12px
      margin-left: 8px
```

---

## Urutan Dependence

```
Tampilkan dari HILIR ke HULU
(user harus void dari yang paling bawah terlebih dahulu)

Contoh urutan benar:
  1. RCP-001 (Penerimaan) — hilir
  2. INV-001 (Sales Invoice) — tengah
  3. DO-001 (Delivery Order) — hulu
```

---

## Visibility

```
Tampil  : isLocked === true (ada dependence yang posted)
Hidden  : dokumen draft / approved / void
Position: di atas semua FormSection, di bawah secondary tabs
```
