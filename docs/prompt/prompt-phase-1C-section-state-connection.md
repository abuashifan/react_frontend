# SECTION TAMBAHAN — Phase 1C
# Koneksi Topbar → Store → Ribbon Overlay → Primary Tabs → Secondary Tabs → Content
#
# Sisipkan section ini ke prompt-phase-1C-app-shell-layout.md
# tepat sebelum bagian "## Issues"

---

## ⚠️ CRITICAL — Arsitektur State Shell

Semua komponen shell terhubung melalui SATU store: `useTabStore`.
Jangan implementasi masing-masing komponen secara terpisah tanpa koneksi store.

`useUIStore` TIDAK BOLEH dipakai untuk state shell berikut:

```
❌ activeModule
❌ activeRibbonItem
❌ isRibbonOpen
❌ isRibbonCollapsed
❌ isSidebarCollapsed
❌ isFormView
```

Semua state tersebut wajib berada di `useTabStore`, kecuali `isFormView`
yang harus diturunkan dari active secondary tab lewat `useViewMode`.

---

## Prinsip Utama

```
KLIK TOPBAR       → setActiveModule() + openRibbon()
KLIK RIBBON ITEM  → openPrimaryTab() + closeRibbon()
KLIK PRIMARY TAB  → setActivePrimaryTab()
KLIK SECONDARY TAB → setActiveSecondaryTab()
```

Tidak ada `navigate()` langsung dari komponen shell.
Tidak ada props drilling antar komponen shell.
Semua komunikasi melalui `useTabStore`.

Pengecualian `navigate()` hanya untuk aksi non-shell:

```
✅ logout → /login
✅ ganti perusahaan → /select-company
✅ breadcrumb page/content → path terkait
```

Topbar module dan Ribbon menu TIDAK BOLEH memakai `navigate()`.
Navigasi ke Dashboard harus `navigate('/')`, bukan `navigate('/dashboard')`.

---

## Source Menu Ribbon — Wajib

Ribbon item TIDAK di-hardcode di `RibbonPanel` atau `AppShell`.
Semua daftar module dan ribbon menu wajib berasal dari:

```
src/router/moduleConfig.ts
```

Struktur minimal:

```typescript
export interface RibbonItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
  permission?: string
}

export interface ModuleConfig {
  id: ModuleKey
  label: string
  path: string
  ribbonItems: RibbonItem[]
}

export const MODULE_CONFIGS: ModuleConfig[] = [...]
export const MODULE_MAP = Object.fromEntries(MODULE_CONFIGS.map((m) => [m.id, m]))
```

Koneksi wajib:

```
Topbar klik module
  → useTabStore.setActiveModule(moduleId)
  → useTabStore.openRibbon()
  → RibbonPanel baca useTabStore.activeModule
  → RibbonPanel ambil MODULE_MAP[activeModule].ribbonItems
  → render menu ribbon sebagai overlay
```

Jika module belum punya menu atau menu kosong:

```
✅ Ribbon tetap muncul sebagai overlay kosong 64px
❌ Jangan return null hanya karena ribbonItems.length === 0
```

Jika ribbon panel muncul tapi kosong, cek urutan berikut:

```
1. activeModule di useTabStore sudah berubah?
2. isRibbonOpen true?
3. MODULE_MAP[activeModule] ada?
4. MODULE_MAP[activeModule].ribbonItems memang ada?
5. Permission filter tidak menghapus semua item sebelum permission loaded?
```

---

## Permission Filter Ribbon — Jangan Membuat Panel Kosong

Ribbon item boleh punya `permission`, tetapi Phase 1C harus tetap bisa membuktikan
koneksi Topbar → Ribbon meskipun permission belum selesai dimuat.

Auth store wajib membedakan:

```
permissionsLoaded === false  → permission belum dimuat
permissionsLoaded === true   → permission sudah dimuat, meskipun array kosong
```

Filter ribbon wajib memakai pola ini:

```typescript
const { can, permissionsLoaded } = usePermission()

const visibleItems = (moduleConfig?.ribbonItems ?? []).filter(
  (item) => !permissionsLoaded || !item.permission || can(item.permission)
)
```

Makna:

```
✅ permission belum loaded → tampilkan ribbon item agar shell bisa dites
✅ permission sudah loaded → filter sesuai permission user
❌ jangan filter dengan can(permission) saat permissionsLoaded masih false
```

---

## Aliran State Lengkap

```
User klik "Penjualan" di Topbar
        │
        ▼
useTabStore.setActiveModule("sales") + openRibbon()
        │
        ├──▶ Topbar      → highlight tab "Penjualan"
        └──▶ RibbonPanel → overlay muncul, render menu Penjualan

User klik "Faktur" di Ribbon
        │
        ▼
useTabStore.openPrimaryTab({...}) + closeRibbon()
        │
        ├──▶ Ribbon       → overlay hilang
        ├──▶ Primary Tabs → tab "Faktur Penjualan" muncul + aktif
        ├──▶ Secondary Tabs → tab "Daftar" otomatis dibuat (pinned)
        └──▶ Content      → render list/workspace terkait

User klik dokumen INV-001 di list
        │
        ▼
useTabStore.openSecondaryTab(primaryTabId, { id: 'inv-001', label: 'INV-001', type: 'form' })
        │
        ├──▶ Secondary Tabs → tab "INV-001" muncul + aktif
        ├──▶ FilterSidebar → HIDDEN (form view)
        └──▶ Content       → render form page
            FixedBottomBar → TAMPIL

User klik "Penjualan" di Topbar saat form view
        │
        ▼
openRibbon()
        │
        └──▶ RibbonPanel → overlay muncul di atas form, tidak menggeser content

User klik module berbeda saat ribbon masih terbuka
        │
        ▼
useTabStore.setActiveModule(moduleBaru) + openRibbon()
        │
        ├──▶ Topbar      → highlight pindah ke module baru
        └──▶ RibbonPanel → overlay tetap terbuka, isi menu berganti ke module baru

User klik "Dashboard" di Primary Tabs
        │
        ▼
useTabStore.setActivePrimaryTab("dashboard")
        │
        ├──▶ activeModule → null
        ├──▶ Ribbon      → TIDAK muncul
        ├──▶ Secondary Tabs → return null
        ├──▶ FilterSidebar  → hidden
        └──▶ Content     → Dashboard content, paddingTop 104px

User klik area kosong Topbar/nav module saat ribbon masih terbuka
        │
        ▼
closeRibbon()
        │
        └──▶ RibbonPanel → overlay tutup
```

---

## useTabStore — Struktur Wajib

File: `src/stores/useTabStore.ts`

```typescript
type ModuleKey =
  | 'dashboard'
  | 'master-data'
  | 'accounting'
  | 'cash-bank'
  | 'sales'
  | 'purchase'
  | 'inventory'
  | 'fixed-assets'
  | 'reports'
  | 'settings'

interface PrimaryTab {
  id: string
  menuKey: string
  label: string
  module: ModuleKey
  path: string
}

interface SecondaryTab {
  id: string
  label: string
  type: 'list' | 'form'
  path: string
  pinned: boolean
  formState?: Record<string, unknown>
}

interface TabState {
  activeModule: ModuleKey | null
  isRibbonOpen: boolean
  isSidebarCollapsed: boolean
  primaryTabs: PrimaryTab[]
  activePrimaryTabId: string | null
  secondaryTabs: Record<string, SecondaryTab[]>
  activeSecondaryTabId: Record<string, string>
}

interface TabActions {
  setActiveModule: (module: ModuleKey | null) => void
  openRibbon: () => void
  closeRibbon: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  openPrimaryTab: (tab: PrimaryTab) => boolean
  closePrimaryTab: (tabId: string) => void
  setActivePrimaryTab: (tabId: string) => void
  openSecondaryTab: (primaryTabId: string, tab: SecondaryTab) => void
  closeSecondaryTab: (primaryTabId: string, secondaryTabId: string) => void
  setActiveSecondaryTab: (primaryTabId: string, secondaryTabId: string) => void
  updateFormState: (primaryTabId: string, secondaryTabId: string, formState: Record<string, unknown>) => void
  clearFormState: (primaryTabId: string, secondaryTabId: string) => void
  getActivePrimaryTab: () => PrimaryTab | undefined
  getActiveSecondaryTab: (primaryTabId?: string) => SecondaryTab | undefined
}
```

Initial state wajib:

```typescript
activeModule: null,
isRibbonOpen: false,
isSidebarCollapsed: false,
primaryTabs: [DASHBOARD_TAB],
activePrimaryTabId: 'dashboard',
secondaryTabs: {},
activeSecondaryTabId: {},
```

Rules action:

```
openPrimaryTab(tab):
  - Jika tab sudah ada → aktifkan tab existing, set activeModule, return true
  - Jika primaryTabs.length >= 10 → return false
  - Jika tab baru → tambah primary tab, buat secondary tab "Daftar" pinned, return true

setActivePrimaryTab(tabId):
  - Aktifkan tab
  - Set activeModule mengikuti tab.module

closeSecondaryTab(primaryTabId, secondaryTabId):
  - Jika tab pinned → jangan tutup
  - Jika active tab ditutup → fallback ke tab sebelumnya atau "list"
```

Persist wajib:

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'seaside-erp-tabs',
    version: 2,
    storage: createJSONStorage(() => sessionStorage),
  }
)
```

---

## sessionStorage — Rules Wajib

```
PERSIST ke sessionStorage:
  ✅ activeModule
  ✅ isRibbonOpen
  ✅ isSidebarCollapsed
  ✅ primaryTabs
  ✅ activePrimaryTabId
  ✅ secondaryTabs
  ✅ activeSecondaryTabId
  ✅ secondaryTab.formState

JANGAN persist ke localStorage:
  ❌ Tab state
  ❌ Form draft

REFRESH halaman:
  ✅ Semua tabs kembali seperti sebelum refresh
  ✅ Draft form kembali
  ✅ Posisi tab aktif kembali

TUTUP browser tab:
  ✅ sessionStorage dihapus → tabs hilang → expected
```

---

## Form Draft Persistence — Disiapkan Phase 1C, Dipakai Phase 3+

`useTabStore` menyiapkan `updateFormState` dan `clearFormState`.
Phase 1C TIDAK wajib membuat form transaksi nyata yang memanggil `updateFormState`.

Saat Phase 3+ membuat form transaksi, form wajib:

```
✅ restore secondaryTab.formState saat mount
✅ simpan values dengan debounce 500ms via updateFormState
✅ panggil clearFormState setelah submit berhasil
✅ jangan simpan draft ke localStorage
```

---

## View Mode Detection — List vs Form

Buat hook:

```
src/hooks/useViewMode.ts
```

```typescript
const activeSecTab = activePrimaryTabId
  ? secondaryTabs[activePrimaryTabId]?.find(t => t.id === activeSecondaryTabId[activePrimaryTabId])
  : undefined

const isFormView = activeSecTab?.type === 'form'
const isListView = activeSecTab?.type === 'list' || !activeSecTab
```

Gunakan `isFormView` hanya untuk:

```
✅ FilterSidebar: hidden jika isFormView
✅ FixedBottomBar: tampil jika isFormView
✅ Content padding-bottom: 56px jika isFormView
```

JANGAN gunakan `isFormView` untuk menyembunyikan ribbon.
Ribbon adalah overlay dan tidak dipengaruhi view mode.

---

## Padding-Top Tetap — Overlay Ribbon

```typescript
const topbarH = 52
const primaryTabsH = 36
const secondaryTabsH = 32
const contentGap = 16

const paddingTop = topbarH + primaryTabsH + secondaryTabsH + contentGap

// = 52 + 36 + 32 + 16 = 136px
```

Rules:

```
✅ paddingTop Dashboard selalu 104px
✅ paddingTop menu/list/form non-Dashboard selalu 136px
✅ Form view: paddingTop 136px, paddingBottom 56px
✅ Ribbon overlay top 52px, height 64px, z-index 60
✅ Ribbon backdrop z-index 59
✅ Ribbon backdrop mulai dari top 52px: `fixed left-0 right-0 bottom-0 top-[52px]`
✅ Klik module berbeda saat ribbon terbuka mengganti isi ribbon, bukan menutup ribbon
✅ Klik area kosong Topbar/nav module saat ribbon terbuka menutup ribbon
✅ Klik button module wajib `event.stopPropagation()` agar tidak dianggap klik area kosong Topbar/nav
❌ Ribbon tidak boleh menambah paddingTop menjadi 200px
❌ Ribbon tidak boleh menyebabkan content shift ke bawah
❌ Backdrop tidak boleh `fixed inset-0` karena akan menutup Topbar z-50
```

---

## Topbar Click Handling — Wajib

Topbar harus membedakan tiga area klik:

```
1. Klik button module yang sama     → closeRibbon()
2. Klik button module berbeda       → setActiveModule(moduleBaru) + openRibbon()
3. Klik area kosong Topbar/nav      → closeRibbon()
```

Implementasi wajib memakai `stopPropagation()` pada button module agar klik module
tidak naik ke handler close area kosong.

```tsx
<nav
  onClick={(event) => {
    if (event.target === event.currentTarget) closeRibbon()
  }}
>
  {MODULE_CONFIGS.map((mod) => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        handleModuleClick(mod.id)
      }}
    >
      ...
    </button>
  ))}
</nav>
```

Larangan:

```
❌ Jangan pasang handler close di parent tanpa `event.target === event.currentTarget`
❌ Jangan lupa `event.stopPropagation()` di button module
❌ Jangan membuat area kosong Topbar tidak bisa dismiss ribbon
```

---

## Urutan Implementasi Wajib

```
1. useTabStore.ts      → implementasi state overlay + persist sessionStorage
                         Dashboard tab pinned default, activePrimaryTabId='dashboard'
2. Topbar.tsx          → klik module: setActiveModule() + openRibbon()
                         klik module sama saat open: closeRibbon()
                         klik area kosong Topbar/nav: closeRibbon()
                         button module: event.stopPropagation()
3. RibbonPanel.tsx     → baca activeModule + isRibbonOpen
                         render MODULE_MAP[activeModule].ribbonItems
                         klik item: openPrimaryTab() + closeRibbon()
4. AppShell.tsx        → render backdrop `fixed left-0 right-0 bottom-0 top-[52px] z-[59]`
                         top content 104px untuk Dashboard, 136px untuk menu
5. PrimaryTabs.tsx     → top 52px
                         Dashboard pinned tanpa close button
6. SecondaryTabs.tsx   → top 88px, return null saat Dashboard aktif
7. WorkspaceLayout.tsx → list view wrapper
8. FormLayout.tsx      → tidak mengatur ribbon
9. FixedBottomBar.tsx  → height 56px
10. useViewMode.ts     → deteksi list/form untuk sidebar dan bottom bar
```

TEST FLOW:

```
→ First load → isRibbonOpen false → ribbon tidak muncul
→ Login / navigate('/') → Dashboard aktif, Primary Tabs tampil, Dashboard posisi pertama
→ Dashboard aktif → paddingTop 104px, secondary tabs tidak muncul
→ Klik "Penjualan" di Topbar → ribbon overlay muncul tepat di bawah Topbar
  - Jika permission belum loaded, ribbon tetap menampilkan menu Penjualan
  - Jika permission sudah loaded, hanya item yang user punya permission yang tampil
→ Klik "Pembelian" di Topbar saat ribbon masih terbuka
  → ribbon tetap terbuka, isi berganti ke menu Pembelian
→ Klik "Pembelian" lagi
  → ribbon tertutup
→ Klik "Penjualan" di Topbar → ribbon terbuka
→ Klik area kosong Topbar/nav module
  → ribbon tertutup
→ Klik "Faktur" di Ribbon → Primary Tab "Faktur Penjualan" terbuka
→ Ribbon auto-hide
→ Secondary Tab "Daftar" muncul otomatis
→ Klik dokumen di list → Secondary Tab "INV-001" terbuka → form render
→ Sidebar HIDDEN (form view), BottomBar TAMPIL (form view)
→ Ribbon TIDAK auto-hide karena form view — tetap bisa diklik lewat Topbar
→ Klik "Penjualan" di Topbar → ribbon overlay muncul di atas form
→ Klik backdrop → ribbon overlay tutup, form tetap di bawah
→ Klik Dashboard di Primary Tabs → ribbon tidak muncul, secondary tabs hilang, paddingTop 104px
→ Refresh browser → tabs dan draft kembali dari sessionStorage
→ Tutup browser tab → sessionStorage hilang
```

---

## Catatan untuk Phase 1C Scaffold

```
✅ Content boleh berupa placeholder workspace/form selama halaman modul belum dibuat
✅ Store dan tab state harus sudah benar
✅ Klik Ribbon harus membuka Primary Tab + Secondary Tab "Daftar"
✅ Klik tombol "Baru" scaffold boleh membuka secondary tab form
❌ Jangan klaim SalesInvoiceListPage render jika halaman modul belum dibuat
```

---

## Yang DILARANG

```
❌ navigate('/sales') saat klik tab Topbar — gunakan setActiveModule() + openRibbon()
❌ navigate('/sales/invoices') saat klik Ribbon — gunakan openPrimaryTab()
❌ memakai useUIStore untuk state shell
❌ isRibbonCollapsed di useTabStore — tidak ada lagi collapse
❌ permission filter membuat ribbon kosong saat permissionsLoaded belum true
❌ Props drilling state antar komponen shell
❌ Hardcode menu ribbon di AppShell
❌ Primary Tab hilang saat ganti module — semua tabs harus persist
❌ Secondary tab "Daftar" bisa ditutup — pinned = true
❌ Lebih dari 10 primary tabs terbuka — harus ada batas + toast warning
❌ Form draft disimpan ke localStorage — harus sessionStorage
❌ clearFormState tidak dipanggil setelah submit berhasil
❌ Ribbon auto-hide di form view — ribbon adalah overlay
❌ Ribbon menyebabkan content shift ke bawah
❌ closeRibbon() tidak dipanggil setelah klik item ribbon
❌ Backdrop `fixed inset-0` menutup Topbar dan membuat klik module lain dianggap klik luar
❌ Klik module berbeda saat ribbon terbuka malah menutup ribbon
❌ Klik area kosong Topbar/nav module tidak menutup ribbon
❌ Button module tidak memakai `event.stopPropagation()`
❌ Dashboard ada di Topbar module tabs
❌ Ribbon muncul saat klik Dashboard di Primary Tabs
❌ Secondary tabs muncul saat Dashboard aktif
❌ navigate('/dashboard') — gunakan navigate('/')
```

---

## File yang Harus Dibuat/Diupdate di Phase 1C

```
src/stores/useTabStore.ts                          ← state overlay utama shell
src/components/shared/layout/AppShell.tsx          ← backdrop top-[52px] + fixed content top 136px
src/components/shared/layout/Topbar.tsx            ← trigger openRibbon/closeRibbon
src/components/shared/layout/RibbonPanel.tsx       ← overlay panel z-[60]
src/components/shared/layout/PrimaryTabs.tsx       ← fixed top 52px
src/components/shared/layout/SecondaryTabs.tsx     ← fixed top 88px
src/components/shared/layout/WorkspaceLayout.tsx   ← list view wrapper
src/components/shared/layout/FormLayout.tsx        ← form view wrapper, tidak hide ribbon
src/components/shared/layout/FixedBottomBar.tsx    ← 56px
src/hooks/useViewMode.ts                           ← deteksi list/form view
```
