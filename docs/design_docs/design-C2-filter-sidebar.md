# C2 — Filter Sidebar

> Panel filter kontekstual di kisi list/workspace view.
> Konten filter berbeda per modul dan workspace.

---

## Anatomi

```
┌────────────────────┐
│ Filter             │  ← header
├────────────────────┤
│ 🔍 Cari...         │  ← search bar (di content area, bukan sidebar)
├────────────────────┤
│ PERIODE            │  ← section title
│ Dari  [________]   │
│ Sampai[________]   │
│ [Hari ini] [Bulan] │  ← quick presets
├────────────────────┤
│ STATUS             │
│ ☐ Draft            │
│ ☑ Approved         │
│ ☑ Posted           │
│ ☐ Void             │
├────────────────────┤
│ CUSTOMER           │
│ [Cari customer ▼]  │
├────────────────────┤
│ [Reset Filter]     │
└────────────────────┘
```

---

## Spesifikasi Container

```
width         : 220px
bg            : #ffffff
border-right  : 1px solid #d9e2e5
position      : fixed, di bawah secondary tabs
padding       : 0 (section punya padding sendiri)
overflow-y    : auto

Collapsed     : width 0, overflow hidden
Transition    : width .2s ease
```

---

## Header Sidebar

```
height        : 40px
padding       : 0 14px
display       : flex items-center justify-between
border-bottom : 1px solid #d9e2e5

Kiri:
  "Filter" — 12px, font-weight 600, color #24323a, uppercase, letter-spacing .04em

Kanan:
  Toggle collapse button
  icon: PanelLeftClose 16px, color #64748b
  hover: color #326273
```

---

## Section

```
padding       : 12px 14px
border-bottom : 1px solid #f1f5f9

Section title:
  font        : 10px, font-weight 700, uppercase, letter-spacing .06em
  color       : #94a3b8
  margin-bottom: 8px
```

---

## Filter Date Range

```
Label "Dari" / "Sampai":
  font    : 11px, font-weight 500, color #64748b
  margin-bottom: 3px

Input date:
  width   : 100%
  height  : 30px
  border  : 1px solid #d9e2e5
  border-radius: 5px
  padding : 0 8px
  font    : 12px
  focus   : border-color #5c9ead

Gap antar field: 8px

Quick presets (baris chip):
  margin-top : 8px
  display    : flex flex-wrap gap-1
  chip style : 10px | px-2 py-0.5 | border-radius 4px
               bg #f1f5f9 | color #475569
               hover: bg #e2e8f0 | color #326273
  Labels     : Hari ini, Minggu ini, Bulan ini, Tahun ini
```

---

## Filter Checkbox List (Status, Tipe)

```
Setiap item:
  display   : flex items-center gap-2
  height    : 28px
  cursor    : pointer
  hover bg  : #f8fbfc
  border-radius: 4px
  padding   : 0 4px

Checkbox  : Shadcn Checkbox, 14px, accent #5c9ead
Label     : 12px, color #334155
```

---

## Filter SearchableSelect (Customer, Vendor)

```
Gunakan komponen SearchableSelect (lihat C3)
width     : 100%
size      : sm (height 30px, font 12px)
```

---

## Reset Button

```
position  : di bawah semua section, sticky bottom
padding   : 12px 14px
border-top: 1px solid #f1f5f9

Button style:
  width   : 100%
  height  : 30px
  bg      : transparent
  border  : 1px solid #d9e2e5
  border-radius: 5px
  font    : 12px, color #64748b
  hover   : border-color #5c9ead, color #326273
  label   : "Reset Filter"
```

---

## Collapsed State

```
Saat collapsed (width 0):
  Tombol expand muncul di content area kiri atas
  icon  : PanelLeftOpen 16px
  size  : 28x28px
  bg    : #ffffff
  border: 1px solid #d9e2e5
  border-radius: 5px
  hover : bg #f8fbfc
```

---

## Visibility Rules

```
TAMPIL  : secondary tab "Daftar" aktif (list view)
HIDDEN  : secondary tab form aktif (form view)
HIDDEN  : halaman /login, /select-company, /onboarding
```
