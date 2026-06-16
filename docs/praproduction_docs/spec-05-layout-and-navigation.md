# 05 — Layout & Navigation

## App Shell Structure

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR (52px, background #326273)                           │
│  [Logo] [Penjualan] [Pembelian] [Inventory] ... [Avatar]     │
├──────────────────────────────────────────────────────────────┤
│  PRIMARY TABS (36px, background #ffffff)                     │
│  [Dashboard*] [Faktur Penjualan ×] [Sales Order ×]          │
├──────────────────────────────────────────────────────────────┤
│  SECONDARY TABS (32px, background #EFEFED)                   │
│  [Daftar] [INV-001 ×] [INV-002 ×] [Baru ×]                 │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│  FILTER    │  CONTENT AREA                                    │
│  SIDEBAR   │  - List view: workspace table                    │
│  (220px)   │  - Form view: full width (sidebar hidden)        │
│            │                                                  │
│            ├─────────────────────────────────────────────────┤
│            │  FIXED BOTTOM BAR (56px) — hanya di form view   │
└────────────┴─────────────────────────────────────────────────┘

↑ RIBBON OVERLAY (64px, fixed top:52px, z-60) muncul di atas tabs/content
saat user klik module tab di Topbar.
```

### Layout Offset Dinamis

```
Topbar          : top=0,          height=52px
Ribbon overlay  : top=52px,       height=64px, z-index=60
Primary Tabs    : top=52px,       height=36px
Secondary Tabs  : top=88px,       height=32px
Content area    : Dashboard = 52+36+16px = 104px
Content area    : Menu aktif = 52+36+32+16px = 136px

Content area padding-top: 104px saat Dashboard aktif, 136px saat menu aktif
Ribbon adalah overlay — tidak mempengaruhi padding-top content

Form view → padding-bottom: 56px (untuk Fixed Bottom Bar)
```

---

## Zone 1 — Topbar

### Spesifikasi
- Height: **52px**
- Background: **#326273**
- Position: `fixed top-0 left-0 right-0 z-50`

### Konten Topbar

**Kiri:**
- Logo mark (rounded square #5c9ead, 24x24, border-radius 6px)
- Nama produk "Seaside Escape" — text white, font-semibold, 14px
- Gap logo ke nama: 8px | margin-right ke tabs: 12px

**Tengah/Kiri (Module Tabs):**
- Tab: Penjualan, Pembelian, Persediaan, Akuntansi, Kas & Bank, Laporan, Master Data
- Dashboard TIDAK ada di Topbar; Dashboard ada di Primary Tabs sebagai pinned tab
- Default: text `rgba(255,255,255,0.7)`
- Active: text white, border-bottom 2px `#e39774`, font-weight 500
- Hover: text white, background `rgba(255,255,255,0.08)`
- Padding: `px-4`, height 100% (52px)
- Alignment: `justify-start` (bukan center)

**Kanan:**
- Nama perusahaan aktif — text `rgba(255,255,255,0.7)`, 13px
- Avatar user (circle 32px, bg #5c9ead, inisial 2 huruf, font 12px white)
- Gap company ke avatar: 12px

**Avatar Dropdown:**
```
┌────────────────────┐
│ Nama User          │  ← 14px font-weight 500
│ email@example.com  │  ← 12px color #64748b
├────────────────────┤
│ Ganti Perusahaan   │
│ Profil Saya        │
├────────────────────┤
│ Keluar             │  ← color #991B1B
└────────────────────┘
min-width: 180px | border-radius: 8px
border: 1px solid #d9e2e5
shadow: 0 4px 12px rgba(0,0,0,0.12)
```

### Behavior
- Topbar selalu visible — tidak pernah disembunyikan
- Klik module tab → ribbon berubah sesuai modul
- Klik Dashboard di Primary Tabs → ribbon tidak muncul
- Active module tab persistent selama di modul tersebut

---

## Zone 2 — Ribbon Panel

### Spesifikasi
- Height: **64px**
- Background: **#ffffff**
- Border-bottom: 1px solid `#d9e2e5`
- Position: `fixed top-[52px] left-0 right-0 z-[60]`
- Backdrop: `fixed left-0 right-0 bottom-0 top-[52px] z-[59]`
- Backdrop tidak boleh memakai `inset-0` karena akan menutup Topbar z-50 dan mencegah klik module lain mengganti ribbon
- Transition: `transform .15s ease, opacity .15s ease`

### Fungsi Ribbon

Ribbon adalah **navigasi menu dalam modul**. Setiap item ribbon = satu menu/workspace
(misal: Faktur Penjualan, Sales Order, Purchase Order).

Klik item ribbon → membuka **Primary Tab** baru untuk menu tersebut.

### Item Format

```
┌──────────┐
│   Icon   │  ← Lucide icon 20px
│  Label   │  ← 11px, font-medium, text-align center
└──────────┘
  min-width: 68px | max-width: 84px | height: 64px
  flex-direction: column | gap: 4px | padding: 0 10px
  border-bottom: 2px solid transparent
```

**States:**
- Default: color `#64748b`, bg transparent
- Hover: color `#326273`, bg `#f8fbfc`
- Active: color `#326273`, bg `#EFF9FB`, border-bottom 2px `#5c9ead`, font-weight 600

Label: wrap ke 2 baris jika perlu — JANGAN ellipsis.

### Overlay Behavior

```
MUNCUL      → klik module tab di Topbar
POSISI      → fixed top:52px left:0 right:0 z-index:60
MODEL       → overlay, tidak menggeser content ke bawah
AUTO-HIDE   → setelah user klik item ribbon
DISMISS     → klik backdrop area luar ribbon
TOGGLE      → klik module yang sama dua kali membuka lalu menutup ribbon
PINDAH      → klik module berbeda saat ribbon terbuka mengganti isi ribbon, bukan menutup
KOSONG      → module tanpa menu tetap render ribbon kosong 64px
```

### Ribbon Menu per Modul

**Penjualan:**
```
[FileText/Penawaran] [ShoppingCart/Sales Order] [Truck/Pengiriman]
[FileCheck/Proforma] [Receipt/Faktur] [CreditCard/Penerimaan]
[RotateCcw/Retur] [Users/Piutang]
```

**Pembelian:**
```
[ClipboardList/Permintaan] [ShoppingBag/Purchase Order]
[Package/Penerimaan Brg] [FileText/Tagihan]
[Banknote/Pembayaran] [RotateCcw/Retur] [Building/Hutang]
```

**Persediaan:**
```
[Boxes/Saldo Stok] [ArrowLeftRight/Mutasi Stok]
[SlidersHorizontal/Penyesuaian] [ClipboardCheck/Opname]
```

**Akuntansi:**
```
[BookOpen/Jurnal Umum] [CalendarRange/Periode Akuntansi]
[Calendar/Tahun Fiskal]
```

**Kas & Bank:**
```
[ArrowDownCircle/Penerimaan] [ArrowUpCircle/Pengeluaran]
[ArrowLeftRight/Transfer] [Landmark/Rekonsiliasi]
```

**Laporan:**
```
[BookOpen/Buku Besar] [Scale/Trial Balance] [TrendingUp/Laba Rugi]
[BarChart2/Neraca] [Waves/Arus Kas] [UserCheck/AR Aging] [Building2/AP Aging]
```

**Master Data:**
```
[ListTree/COA] [Contact/Kontak] [Package/Produk] [Ruler/Satuan]
[Warehouse/Gudang] [Clock/Syarat Bayar] [Building/Departemen]
[FolderKanban/Proyek] [Link/Pemetaan Akun]
```

### Behavior
- Ribbon tidak dipengaruhi list/form view.
- Tidak ada collapse/expand button.
- Klik item ribbon → buka/aktifkan Primary Tab lalu `closeRibbon()`.
- Klik backdrop → `closeRibbon()`.

---

## Zone 3 — Primary Tabs

### Spesifikasi
- Height: **36px**
- Background: **#ffffff**
- Border-bottom: 1px solid `#d9e2e5`
- Position: `fixed top-[52px] left-0 right-0 z-38`

### Konsep

Primary tabs merepresentasikan **menu yang sedang dibuka**.
Satu tab = satu menu (misal: Faktur Penjualan, Sales Order).
Dibuka otomatis saat user klik item di ribbon.
Dashboard adalah primary tab pinned di posisi pertama.

```
[Dashboard*] [Faktur Penjualan ×] [Sales Order ×] [Purchase Order ×]
 ↑ pinned     ↑ active               ↑ inactive     ↑ modul berbeda
```

### Tab Item

```
height: 36px (full) | padding: 0 12px
border-right: 1px solid #d9e2e5
border-bottom: 2px solid transparent
font: 13px | white-space: nowrap
display: flex | align-items: center | gap: 6px

States:
  DEFAULT → bg #f8fbfc | color #64748b
  HOVER   → bg #eef4f5 | color #326273
  ACTIVE  → bg #ffffff | color #326273 | font-weight 500
             border-bottom: 2px solid #5c9ead

Close button (×):
  16x16px | border-radius 3px | color #94a3b8
  hover → bg #fee2e2 | color #991B1B
```

### Rules
- Primary Tabs selalu visible
- Dashboard pinned di posisi pertama, default aktif saat login, tidak bisa ditutup
- Maksimal **10 primary tabs** terbuka sekaligus
- Jika sudah 10 → toast warning, tab baru tidak dibuka
- Klik ribbon item yang sudah ada tabnya → activate tab yang ada, tidak duplikat
- Tutup tab (×) → hapus tab + semua secondary tabs + form state di dalamnya
- Tab dari modul berbeda bisa ada bersamaan

---

## Zone 4 — Secondary Tabs

### Spesifikasi
- Height: **32px**
- Background: **#EFEFED** (page-bg)
- Border-bottom: 1px solid `#d9e2e5`
- Position: `fixed top-[52+ribbonH+36] left-0 right-0 z-37`

### Konsep

Secondary tabs merepresentasikan **dokumen yang sedang dibuka** dalam satu menu.
Selalu ada satu tab pinned **"Daftar"** (list page) yang tidak bisa ditutup.

```
[Daftar] [INV-2026-001 ×] [INV-2026-002 ×] [Baru ×]
 ↑ pinned                   ↑ form dokumen    ↑ form create baru
```

### Tab Item

```
height: 32px | padding: 0 10px
border: 1px solid transparent | border-bottom: 0
border-radius: 5px 5px 0 0
font: 12px | white-space: nowrap
margin-top: 4px

States:
  DEFAULT → bg transparent | color #64748b
  HOVER   → bg rgba(255,255,255,0.7) | color #326273
  ACTIVE  → bg #ffffff | color #326273 | font-weight 500
             border: 1px solid #d9e2e5 | border-bottom: 0

Tab "Daftar": sama tapi TIDAK ada close button
Close button (×): 14x14px | hover → bg #fee2e2 | color #991B1B
```

### Rules
- Secondary tabs `return null` saat Dashboard aktif
- Tab "Daftar" selalu ada, posisi pertama, tidak bisa ditutup
- Klik dokumen di list → cek apakah tab sudah ada:
  - Sudah ada → activate tab tersebut
  - Belum ada → buat tab baru dengan label = nomor dokumen
- Klik "+ Buat Baru" → buat secondary tab dengan label "Baru"
- Tutup secondary tab → kembali ke "Daftar" otomatis
- Secondary tabs scope per primary tab (masing-masing punya tabs sendiri)

---

## Zone 5 — Filter Sidebar

### Spesifikasi
- Width: **220px**
- Background: **#ffffff**
- Border-right: 1px solid `#d9e2e5`
- Position: fixed left, di bawah secondary tabs

### Visibility Rules
- **TAMPIL**: di list/workspace view (secondary tab "Daftar" aktif)
- **TERSEMBUNYI**: di Dashboard atau form view (secondary tab form aktif)
- Bisa di-toggle collapse — state di `useTabStore`

### Konten Filter
Filter bersifat contextual — lihat `13-filter-and-search.md` untuk detail per workspace.

---

## Zone 6 — Content Area

### List View
```
Content Area
├── Page Title + Action Bar (Search + Tombol Buat Baru)
└── DataTable (horizontal scroll enabled)
```

### Form View
```
Content Area (full width, sidebar hidden)
├── Form Header (2-column grid)
├── Line Items Table (horizontal scroll)
├── Form Summary (right-aligned)
└── [Fixed Bottom Bar — action buttons]
```

---

## Zone 7 — Fixed Bottom Bar (Form Only)

### Spesifikasi
- Height: **56px**
- Background: **#ffffff**
- Border-top: 1px solid `#d9e2e5`
- Position: `fixed bottom-0 left-0 right-0 z-40`
- Padding: `px-6`

### Layout
```
[Kiri: Nomor dokumen · Status]    [Kanan: Action buttons]
```

### Visibility
- **HANYA** muncul di form view (secondary tab bukan "Daftar")
- Tidak muncul jika document LOCKED
- Tidak muncul jika document void

Detail button logic → `10-document-workflow.md`

---

## Navigation State — useTabStore

Store ini menjadi sumber utama state navigasi virtual tabs.
Persist ke **sessionStorage** — bertahan selama browser tab tidak ditutup.

```typescript
interface PrimaryTab {
  id: string
  menuKey: string        // key ribbon item, misal 'Faktur'
  label: string          // label lengkap, misal 'Faktur Penjualan'
  module: string         // modul induk, misal 'Penjualan'
}

interface SecondaryTab {
  id: string
  label: string          // 'Daftar' | 'INV-001' | 'Baru'
  type: 'list' | 'form'
  pinned?: boolean       // true untuk tab 'Daftar'
  formState?: Record<string, unknown>  // draft form data
}

interface TabState {
  // Ribbon overlay
  isRibbonOpen: boolean
  isSidebarCollapsed: boolean

  // Virtual tabs
  primaryTabs: PrimaryTab[]
  activePrimaryTab: string | null
  secondaryTabs: Record<string, SecondaryTab[]>    // key: primaryTab.id
  activeSecondaryTab: Record<string, string>        // key: primaryTab.id → secondaryTab.id
}
```

```typescript
// Zustand persist ke sessionStorage
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

### Form State Persistence

```
- Draft form disimpan di secondaryTab.formState
- Update formState setiap onChange (debounce 500ms)
- Saat secondary tab di-close → formState dihapus
- Saat secondary tab di-activate → form di-hydrate dari formState
- Refresh halaman → semua tabs dan draft form state kembali
```

---

## Visibility Rules Ringkasan

```
TOPBAR          → selalu tampil, semua halaman
RIBBON          → overlay, muncul saat module diklik di Topbar
                  auto-hide setelah pilih menu atau klik backdrop
                  tidak dipengaruhi view mode (list/form)
PRIMARY TABS    → always visible, Dashboard pinned posisi pertama
SECONDARY TABS  → tampil jika ada active primary tab non-Dashboard
FILTER SIDEBAR  → tampil di list view | hidden di Dashboard dan form view
BOTTOM BAR      → tampil hanya di form view (secondary tab bukan 'Daftar')
```

---

## Layout Components

```typescript
// AppShell.tsx       — root layout, hitung semua offset dinamis
// Topbar.tsx         — module tabs + avatar dropdown
// RibbonPanel.tsx    — overlay ribbon menu per modul
// PrimaryTabs.tsx    — virtual tabs per menu yang dibuka
// SecondaryTabs.tsx  — virtual tabs list + form dokumen
// FilterSidebar.tsx  — contextual filter panel
// WorkspaceLayout.tsx — list view layout
// FormLayout.tsx     — form view layout (full width)
// FixedBottomBar.tsx — action buttons container
```

### Penggunaan di Page

```typescript
// List page — secondary tab "Daftar" aktif
export function SalesInvoiceListPage() {
  return (
    <WorkspaceLayout title="Faktur Penjualan">
      <DataTable ... />
    </WorkspaceLayout>
  )
}

// Form page — secondary tab form aktif
export function SalesInvoiceFormPage() {
  return (
    <FormLayout
      title="Faktur Penjualan"
      documentNumber="INV-2026-001"
      status="draft"
    >
      <InvoiceForm />
    </FormLayout>
  )
}
```
