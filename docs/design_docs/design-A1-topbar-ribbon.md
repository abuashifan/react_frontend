# A1 — Topbar, Ribbon, Primary Tabs & Secondary Tabs

> Referensi desain untuk komponen navigasi utama Seaside Escape ERP.
> Ikuti spec ini PERSIS. Jangan improvisasi warna, ukuran, atau spacing.

---

## STRUKTUR LAYER NAVIGASI

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR (52px) — fixed, z-50                                │
│  Logo + Nama Produk │ Module Tabs │ Company + Avatar        │
├─────────────────────────────────────────────────────────────┤
│  PRIMARY TABS (36px) — fixed, z-38                          │
│  [Dashboard*] [Faktur Penjualan ×] [Sales Order ×]          │
├─────────────────────────────────────────────────────────────┤
│  SECONDARY TABS (32px) — fixed, z-37                        │
│  [Daftar] [INV-001 ×] [INV-002 ×]                          │
├─────────────────────────────────────────────────────────────┤
│  CONTENT AREA                                               │
│  Dashboard padding-top: 52 + 36 + 16 = 104px               │
│  Menu padding-top     : 52 + 36 + 32 + 16 = 136px          │
└─────────────────────────────────────────────────────────────┘

RIBBON OVERLAY (64px) — fixed top:52px, z-60, muncul di atas tabs/content.
```

---

## ZONE 1 — TOPBAR

```
h=52px | bg=#326273 | position=fixed top-0 left-0 right-0 | z-index=50
```

### Layout

```
[■ Seaside Escape]  [Penjualan] [Pembelian] [Persediaan] ...  [PT Maju Jaya] [AV]
 ↑ kiri, flex-shrink-0            ↑ flex-1, justify-start        ↑ kanan, flex-shrink-0
```

### Kiri — Logo + Product Name

```
logo-mark   : rounded square 24x24, bg #5c9ead, border-radius 6px
              inner mark: rounded square 9x9, bg rgba(255,255,255,0.92)
gap         : 8px
product-name: font 14px, font-weight 600, color #ffffff
margin-right: 12px (gap ke module tabs)
```

### Tengah — Module Tabs

```
Urutan: Penjualan | Pembelian | Persediaan | Akuntansi | Kas & Bank | Laporan | Master Data
Dashboard tidak ada di Topbar. Dashboard ada di Primary Tabs sebagai pinned tab.

Tab states:
  DEFAULT  → color rgba(255,255,255,0.7) | bg transparent | border-bottom transparent
  HOVER    → color #ffffff | bg rgba(255,255,255,0.08)
  ACTIVE   → color #ffffff | bg transparent | border-bottom 2px solid #e39774 | font-weight 500

Padding per tab : px-4 py-0 (h=52px, full height)
Font            : 14px, tidak uppercase
Overflow        : overflow-x auto, scrollbar hidden
```

### Kanan — Company + Avatar

```
company-name : font 13px | color rgba(255,255,255,0.7) | white-space nowrap
gap          : 12px
avatar       : circle 32x32 | bg #5c9ead | color #ffffff | font 12px font-weight 500
               inisial 2 huruf dari nama user

Avatar dropdown (Shadcn DropdownMenu):
  ┌────────────────────┐
  │ Andi Wijaya        │  ← 14px font-weight 500
  │ andi@example.com   │  ← 12px color #64748b
  ├────────────────────┤
  │ Ganti Perusahaan   │  ← 14px
  │ Profil Saya        │  ← 14px
  ├────────────────────┤
  │ Keluar             │  ← 14px color #991B1B
  └────────────────────┘
  min-width: 180px | border-radius 8px
  border: 1px solid #d9e2e5
  shadow: 0 4px 12px rgba(0,0,0,0.12)
  padding: 6px 0
  item padding: 7px 12px
  item hover bg: #f8fbfc
```

---

## ZONE 2 — RIBBON

```
h=64px | bg=#ffffff | border-bottom 1px solid #d9e2e5
position=fixed | top=52px | left-0 right-0 | z-index=60
backdrop=fixed left-0 right-0 bottom-0 top-[52px] | z-index=59
backdrop tidak boleh menutup Topbar
transition: transform .15s ease, opacity .15s ease
```

### Overlay State

```
OPEN   → height 64px, opacity 1, pointer-events auto
CLOSED → height 64px, opacity 0, pointer-events none, translate-y -1

Trigger:
- Klik module tab di Topbar → `openRibbon()`
- Klik module yang sama saat ribbon terbuka → `closeRibbon()`
- Klik module berbeda saat ribbon terbuka → `setActiveModule(moduleBaru)` + `openRibbon()`
- Klik item ribbon → `openPrimaryTab()` lalu `closeRibbon()`
- Klik backdrop area luar ribbon → `closeRibbon()`

Ribbon tetap overlay di atas list/form view. Tidak ada auto-hide khusus form view.
Jika module belum punya menu, render panel kosong setinggi 64px.
```

### Ribbon Item

```
┌──────────┐
│   icon   │  ← Lucide icon 20x20, stroke currentColor
│  Label   │  ← 11px, font-weight 500, text-align center
└──────────┘
  min-width: 68px | max-width: 84px | height: 64px
  flex-direction: column | align-items: center | gap: 4px
  padding: 0 10px
  border-bottom: 2px solid transparent

States:
  DEFAULT → color #64748b | bg transparent
  HOVER   → color #326273 | bg #f8fbfc
  ACTIVE  → color #326273 | bg #EFF9FB | border-bottom 2px solid #5c9ead | font-weight 600

Label: wrap ke 2 baris jika perlu, overflow-wrap: anywhere, JANGAN ellipsis
```

### Ribbon Content Per Modul

```
PENJUALAN
  [FileText/Penawaran] [ShoppingCart/Sales Order] [Truck/Pengiriman]
  [FileCheck/Proforma] [Receipt/Faktur] [CreditCard/Penerimaan]
  [RotateCcw/Retur] [Users/Piutang]

PEMBELIAN
  [ClipboardList/Permintaan] [ShoppingBag/Purchase Order]
  [Package/Penerimaan Brg] [FileText/Tagihan]
  [Banknote/Pembayaran] [RotateCcw/Retur] [Building/Hutang]

PERSEDIAAN
  [Boxes/Saldo Stok] [ArrowLeftRight/Mutasi Stok]
  [SlidersHorizontal/Penyesuaian] [ClipboardCheck/Opname]

AKUNTANSI
  [BookOpen/Jurnal Umum] [CalendarRange/Periode Akuntansi]
  [Calendar/Tahun Fiskal]

KAS & BANK
  [ArrowDownCircle/Penerimaan] [ArrowUpCircle/Pengeluaran]
  [ArrowLeftRight/Transfer] [Landmark/Rekonsiliasi]

LAPORAN
  [BookOpen/Buku Besar] [Scale/Trial Balance] [TrendingUp/Laba Rugi]
  [BarChart2/Neraca] [Waves/Arus Kas] [UserCheck/AR Aging] [Building2/AP Aging]

MASTER DATA
  [ListTree/COA] [Contact/Kontak] [Package/Produk] [Ruler/Satuan]
  [Warehouse/Gudang] [Clock/Syarat Bayar] [Building/Departemen]
  [FolderKanban/Proyek] [Link/Pemetaan Akun]
```

---

## ZONE 3 — PRIMARY TABS

```
h=36px | bg=#ffffff | border-bottom 1px solid #d9e2e5
position=fixed | top=52px | z-index=38
```

### Konsep

Primary tabs merepresentasikan **menu yang sedang dibuka**.
Satu tab = satu menu (misal: Faktur Penjualan, Sales Order, Purchase Order).
Dibuka saat user klik item di ribbon.
Dashboard adalah pinned primary tab di posisi pertama.

```
[Dashboard*] [Faktur Penjualan ×] [Sales Order ×] [Purchase Order ×]
 ↑ pinned     ↑ active               ↑ inactive     ↑ modul berbeda
```

### Tab Item

```
height: 36px (full height) | padding: 0 12px
display: flex | align-items: center | gap: 6px
border-right: 1px solid #d9e2e5
border-bottom: 2px solid transparent
font: 13px
white-space: nowrap

States:
  DEFAULT → bg #f8fbfc | color #64748b
  HOVER   → bg #eef4f5 | color #326273
  ACTIVE  → bg #ffffff | color #326273 | font-weight 500 | border-bottom 2px solid #5c9ead

Close button (×):
  width/height: 16px | border-radius 3px
  bg transparent | color #94a3b8 | font 14px
  hover → bg #fee2e2 | color #991B1B
```

### Rules

```
- Maksimal 10 primary tab terbuka sekaligus
- Dashboard selalu ada di posisi pertama, default aktif, dan tidak punya close button
- Klik Dashboard di Primary Tabs tidak membuka ribbon
- Jika sudah 10 → tampilkan toast warning, tab baru tidak dibuka
- Klik ribbon item yang sudah ada tabnya → activate tab yang ada (tidak buat duplikat)
- Tutup tab (×) → hapus tab + semua secondary tabs di dalamnya + state form-nya
- Tab terakhir ditutup → primary tabs bar kosong (tetap tampil, tapi empty)
- Tab dari modul berbeda bisa ada bersamaan
  contoh: [Faktur Penjualan] [Purchase Order] ← dari 2 modul berbeda
```

---

## ZONE 4 — SECONDARY TABS

```
h=32px | bg=#EFEFED (page-bg) | border-bottom 1px solid #d9e2e5
position=fixed | top=88px | z-index=37
```

### Konsep

Secondary tabs merepresentasikan **dokumen yang sedang dibuka** dalam satu menu.
Selalu ada satu tab pinned "Daftar" (list page) yang tidak bisa ditutup.

```
[Daftar] [INV-2026-001 ×] [INV-2026-002 ×] [Baru ×]
 ↑ pinned, tidak ada ×      ↑ form dokumen    ↑ form create baru
```

### Tab Item

```
height: full (32px) | padding: 0 10px
display: flex | align-items: center | gap: 5px
border: 1px solid transparent | border-bottom: 0
border-radius: 5px 5px 0 0
font: 12px
white-space: nowrap
margin-top: 4px (tabs "naik" dari bawah container)

States:
  DEFAULT → bg transparent | color #64748b
  HOVER   → bg rgba(255,255,255,0.7) | color #326273
  ACTIVE  → bg #ffffff | color #326273 | font-weight 500
             border: 1px solid #d9e2e5 | border-bottom: 0

Tab pinned "Daftar":
  Sama seperti di atas tapi TIDAK ada close button (×)

Close button (×):
  width/height: 14px | border-radius 2px
  bg transparent | color #94a3b8 | font 12px
  hover → bg #fee2e2 | color #991B1B
```

### Rules

```
- Tab "Daftar" selalu ada, posisi pertama, tidak bisa ditutup
- Secondary tabs tidak render saat Dashboard aktif
- Klik dokumen di list → cek apakah tab sudah ada:
    sudah ada  → activate tab tersebut
    belum ada  → buat tab baru dengan label = nomor dokumen
- Klik "+ Buat Baru" → buat secondary tab dengan label "Baru"
- Tutup secondary tab form → kembali ke "Daftar" otomatis
- Secondary tabs scope per primary tab
  (Faktur Penjualan punya tabs sendiri, Sales Order punya tabs sendiri)
```

---

## STATE MANAGEMENT

### Store: useTabStore (Zustand + sessionStorage)

```typescript
interface PrimaryTab {
  id: string
  menuKey: string       // key ribbon item, misal 'Faktur'
  label: string         // label lengkap, misal 'Faktur Penjualan'
  module: string        // modul induk, misal 'Penjualan'
}

interface SecondaryTab {
  id: string
  label: string         // 'Daftar' | 'INV-001' | 'Baru'
  type: 'list' | 'form'
  pinned?: boolean      // true untuk tab 'Daftar'
  formState?: Record<string, unknown>  // draft form data tersimpan di sini
}

interface TabState {
  primaryTabs: PrimaryTab[]
  activePrimaryTab: string | null
  secondaryTabs: Record<string, SecondaryTab[]>      // key: primaryTab.id
  activeSecondaryTab: Record<string, string>          // key: primaryTab.id → secondaryTab.id
}
```

### Persistence: sessionStorage

```typescript
// Zustand persist middleware
import { persist, createJSONStorage } from 'zustand/middleware'

const useTabStore = create(
  persist(
    (set, get) => ({ ...tabState, ...tabActions }),
    {
      name: 'seaside-erp-tabs',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
```

```
Scope     : sessionStorage — bertahan selama browser tab tidak ditutup
Hilang    : saat tab browser ditutup atau sessionStorage di-clear
Behavior  : refresh halaman → semua tab dan draft form state kembali
Max tabs  : 10 primary tabs
```

### Form State Persistence

```
Draft form yang belum di-save disimpan di secondaryTab.formState
Update formState setiap onChange field (debounce 500ms)
Saat secondary tab di-close → formState dihapus dari store
Saat secondary tab di-activate kembali → form di-hydrate dari formState
```

---

## LAYOUT OFFSET DINAMIS

```
topbar          : top=0,             height=52px
ribbon overlay  : top=52px,          height=64px, z-index=60
primary-tabs    : top=52px,          height=36px
secondary-tabs  : top=88px,          height=32px
content area    : padding-top = 52+36+32+16 = 136px

Ribbon tidak mempengaruhi padding karena overlay.
Dashboard: padding-top = 52+36+16 = 104px, tanpa secondary tabs.
FORM VIEW: padding-top tetap 136px, bottom-bar visible, height 56px.
LIST VIEW: padding-top tetap 136px, bottom-bar hidden.
```

### Tailwind Implementation

```tsx
// AppShell — offset tetap karena ribbon overlay
const primaryTop = 52
const secondaryTop = 52 + 36
const contentPaddingTop = isDashboard ? 52 + 36 + 16 : 52 + 36 + 32 + 16

// Applied via inline style/CSS variable
<div style={{ paddingTop: contentPaddingTop }} />
```

---

## VISIBILITY RULES RINGKASAN

```
TOPBAR          → selalu tampil, semua halaman
RIBBON          → overlay, muncul saat module diklik di Topbar
                  auto-hide setelah pilih menu atau klik backdrop
PRIMARY TABS    → always visible, Dashboard pinned posisi pertama
SECONDARY TABS  → tampil jika active primary tab bukan Dashboard
BOTTOM BAR      → tampil hanya di form view (secondary tab bukan 'list')
```

---

## UKURAN RINGKASAN

| Elemen | Height | bg | z-index | top |
|---|---|---|---|---|
| Topbar | 52px | #326273 | 50 | 0 |
| Ribbon overlay | 64px | #ffffff | 60 | 52px |
| Primary Tabs | 36px | #ffffff | 38 | 52px |
| Secondary Tabs | 32px | #EFEFED | 37 | 88px |
| Content area Dashboard | — | — | — | padding-top 104px |
| Content area menu | — | — | — | padding-top 136px |
| Bottom Bar | 56px | #ffffff | 40 | fixed bottom |
