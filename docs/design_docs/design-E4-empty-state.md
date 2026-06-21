# E4 — EmptyState

> Tampilan saat list/tabel kosong — tidak ada data atau tidak ada hasil pencarian.

---

## Anatomi

```
          ┌───────────────────────────┐
          │                           │
          │    [  icon  ]             │
          │                           │
          │   Belum ada invoice       │
          │                           │
          │  Buat invoice pertama     │
          │  untuk memulai.           │
          │                           │
          │  [+ Buat Invoice]         │
          │                           │
          └───────────────────────────┘
            (di dalam td colspan semua kolom)
```

---

## Spesifikasi

```
Layout:
  display     : flex flex-col items-center
  text-align  : center
  padding     : 48px 24px
  gap         : 8px

Icon wrapper:
  width/height: 48px
  border-radius: 12px
  bg          : #f1f5f9
  display     : flex items-center justify-center
  margin-bottom: 4px

  Icon        : 24px, color #94a3b8
  Icon dipilih sesuai konteks:
    Invoice   → FileText
    Customer  → Users
    Produk    → Package
    Stok      → Boxes
    Jurnal    → BookOpen
    Default   → Inbox

Title:
  font        : 14px, font-weight 600, color #24323a

Description:
  font        : 13px, color #64748b
  max-width   : 260px

Action button (opsional):
  margin-top  : 4px
  style       : outline, size sm
  Wrap dengan PermissionGuard
```

---

## Dua Konteks

```
KOSONG (belum ada data sama sekali):
  Icon        : sesuai konteks
  Title       : "Belum ada {nama data}"
  Description : "Buat {nama data} pertama untuk memulai."
  Button      : "+ Buat {nama data}" (jika punya permission)

TIDAK ADA HASIL (ada search/filter aktif):
  Icon        : Search
  Title       : "Tidak ada hasil"
  Description : "Tidak ditemukan data yang cocok dengan filter Anda."
  Button      : "Reset Filter" (clear semua filter)
```
