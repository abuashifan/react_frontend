# C3 — SearchableSelect

> Dropdown searchable untuk semua picker: customer, vendor, produk, COA, dll.
> Dipakai di hampir semua form dan filter sidebar.

---

## States Diagram

```
DEFAULT (belum ada value)
┌─────────────────────────────┐
│ Pilih customer...        ▼  │
└─────────────────────────────┘

TYPING (user sedang ketik)
┌─────────────────────────────┐
│ PT Maj                   ×  │  ← clear button muncul
└─────────────────────────────┘
┌─────────────────────────────┐
│ ⟳ Mencari...               │  ← loading dropdown
└─────────────────────────────┘

RESULT (ada hasil)
┌─────────────────────────────┐
│ PT Maj                   ×  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ PT Maju Jaya        C-001   │  ← hover: bg #EFF9FB
│ PT Maju Bersama     C-002   │
│ PT Maju Sejahtera   C-003   │
└─────────────────────────────┘

EMPTY (tidak ada hasil)
┌─────────────────────────────┐
│ PT Xyz                   ×  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Tidak ditemukan             │  ← gray, center
└─────────────────────────────┘

SELECTED (value terpilih)
┌─────────────────────────────┐
│ PT Maju Jaya             ×  │  ← clear button, warna text lebih gelap
└─────────────────────────────┘

DISABLED
┌─────────────────────────────┐
│ PT Maju Jaya             ▼  │  ← opacity 60%, cursor not-allowed
└─────────────────────────────┘

ERROR
┌─────────────────────────────┐
│ Pilih customer...        ▼  │  ← border merah
└─────────────────────────────┘
  Customer wajib dipilih        ← error text di bawah
```

---

## Spesifikasi Input

```
height        : 36px (desktop) | 34px (tablet)
border        : 1px solid #d9e2e5
border-radius : 6px
padding       : 0 10px
font          : 14px (desktop) | 13px (tablet)
color         : #24323a
bg            : #ffffff
cursor        : text

focus:
  border-color: #5c9ead
  box-shadow  : 0 0 0 3px rgba(92,158,173,0.12)

error:
  border-color: #ef4444
  focus shadow: 0 0 0 3px rgba(239,68,68,0.12)

disabled:
  bg          : #f8fbfc
  color       : #94a3b8
  cursor      : not-allowed
  opacity     : 60%
```

---

## Dropdown Panel

```
position      : absolute, z-50
width         : sama dengan input (min 200px)
bg            : #ffffff
border        : 1px solid #d9e2e5
border-radius : 8px
box-shadow    : 0 4px 12px rgba(0,0,0,0.12)
margin-top    : 4px
max-height    : 280px
overflow-y    : auto
padding       : 4px 0
```

---

## Dropdown Item

```
height        : 36px
padding       : 0 12px
display       : flex items-center justify-between
cursor        : pointer
font          : 13px

DEFAULT:
  bg          : transparent
  color       : #24323a

HOVER:
  bg          : #EFF9FB
  color       : #326273

ACTIVE/SELECTED:
  bg          : #EFF9FB
  color       : #326273
  font-weight : 500
  Tampilkan checkmark kanan: Check 14px, color #5c9ead

Label (kiri)  : text utama, 13px
Sublabel (kanan): kode/info tambahan, 11px, color #94a3b8, tabular-nums
```

---

## Loading State dalam Dropdown

```
┌─────────────────────────────┐
│  ⟳  Mencari...              │
└─────────────────────────────┘
  spinner: 14px, color #5c9ead, animate-spin
  text   : "Mencari...", 13px, color #64748b
  height : 40px, centered
```

---

## Empty State dalam Dropdown

```
┌─────────────────────────────┐
│  Tidak ditemukan            │
└─────────────────────────────┘
  text   : "Tidak ditemukan", 13px, color #94a3b8
  height : 40px, centered
```

---

## Behavior Rules

```
Trigger search  : minimum 2 karakter
Debounce        : 300ms setelah ketik berhenti
Max hasil       : 10 item di dropdown
Clear button    : muncul jika ada value (× di kanan input)
Keyboard        : ↑↓ navigate, Enter select, Escape tutup
Scroll          : jika result > 280px, scroll dalam dropdown
Outside click   : tutup dropdown
```

---

## Ukuran Varian

```
DEFAULT (form)    : height 36px, font 14px
SM (filter sidebar): height 30px, font 12px

// Penggunaan
<SearchableSelect size="sm" ... />
```

---

## Error Text

```
Tampil di bawah input
font      : 12px
color     : #ef4444
margin-top: 4px
```
