# Phase 1C — App Shell & Layout

**Label:** `ui-component`
**Status:** ✅ Done
**Verifikasi:** Navigasi antar module berfungsi, ribbon berubah sesuai module aktif.
**Commit:** `feat(layout): app shell, topbar, ribbon, workspace layout`

---

## Issues

### ISSUE-1C-01 — AppShell component
- Root layout wrapper yang mengatur semua zone: Topbar + Ribbon + FilterSidebar + Content
- padding-top Dashboard aktif: 104px (52 topbar + 36 primary tabs + 16 gap)
- padding-top menu aktif: 136px (52 topbar + 36 primary tabs + 32 secondary tabs + 16 gap)
- Ribbon tidak mempengaruhi padding-top karena overlay
- Handle margin-left sesuai FilterSidebar (220px) saat tampil
- Handle padding-bottom saat FixedBottomBar aktif (56px)
- Render backdrop `fixed left-0 right-0 bottom-0 top-[52px] z-[59]` untuk dismiss ribbon saat `isRibbonOpen = true`
- Backdrop tidak boleh menutup Topbar (`top-[52px]`, bukan `inset-0`) agar klik module lain tetap mengganti ribbon
- File: `src/components/shared/layout/AppShell.tsx`

### ISSUE-1C-02 — Topbar component (module tabs)
- Height: 52px, background `#326273`, position `fixed top-0 z-50`
- Kiri: logo mark (rounded square `#5c9ead`, 24x24) + "Seaside Escape" + divider tipis `w-px h-5 bg-white/20`
- Tengah (nav): icon-only `w-10` per modul, position `items-end pb-[10px]` (icon duduk di bawah, dekat border indicator)
  - Dashboard TIDAK ada di Topbar; Dashboard ada sebagai Primary Tab pinned
  - 9 modul: Master Data, Buku Besar, Kas & Bank, Penjualan, Pembelian, Persediaan, Aktiva Tetap, Daftar Laporan, Pengaturan
  - Setiap button punya `aria-label` = nama modul
  - Tooltip muncul saat hover & `:focus-visible` via Radix `TooltipProvider` (`delayDuration={300}`)
  - Tooltip style: `bg-[#1e3a44]` text white, `side="bottom"`
  - Default: icon `text-white/70`, `border-transparent`, `strokeWidth 1.75`
  - Active: icon `text-white`, `border-b-2 #e39774`, `bg-white/[0.08]`, `strokeWidth 2.5`
  - Hover: `text-white`, `bg-white/[0.08]`
  - Focus: `ring-2 ring-white/50 ring-inset`
  - Keyboard: Tab antar module berfungsi penuh
- Kanan: nama company aktif + avatar user + dropdown (ganti company, profil, logout)
- Klik tab → update `useTabStore.activeModule` + `openRibbon()` → Ribbon overlay muncul
- Klik module yang sama saat ribbon terbuka → `closeRibbon()`
- Klik module berbeda saat ribbon terbuka → `setActiveModule(moduleBaru)` + `openRibbon()`; ribbon tetap terbuka dan kontennya berganti
- Klik area kosong di dalam Topbar/nav module → `closeRibbon()`; ini dipakai untuk dismiss saat user klik area Topbar yang bukan tombol module
- Handler klik button module wajib `event.stopPropagation()` supaya klik module berbeda tidak dianggap klik area kosong Topbar/nav
- File: `src/components/shared/layout/Topbar.tsx`

> **[TIDAK DIGUNAKAN — model sebelumnya]** Model awal topbar menggunakan text label `12px / px-3` tanpa icon.
> Digantikan oleh model icon + tooltip di atas karena lebih compact untuk 10 modul.
> Icon map: Master Data→`Database`, Buku Besar→`BookMarked`,
> Kas & Bank→`Banknote`, Penjualan→`ShoppingCart`, Pembelian→`ShoppingBag`,
> Persediaan→`Boxes`, Aktiva Tetap→`Building`, Daftar Laporan→`FileBarChart2`, Pengaturan→`Settings`

### ISSUE-1C-03 — RibbonPanel component
- Height: 64px, background `#ffffff`, border-bottom `1px solid #d9e2e5`
- Overlay model: `fixed top-[52px] left-0 right-0 z-[60]`
- Muncul saat `isRibbonOpen = true` (dikontrol `useTabStore`)
- Backdrop z-[59] di `AppShell` untuk dismiss saat klik luar Topbar dan luar Ribbon
- Backdrop wajib mulai dari `top-[52px]`, bukan `inset-0`, supaya tidak menangkap klik Topbar
- Item: icon (20px Lucide) + label (11px font-medium), width 72-88px
  - Default: icon + text `#64748b`
  - Hover: bg `#f8fbfc`, icon + text `#5c9ead` / `#326273`
  - Active: bg `#EFF9FB`, border-bottom 2px `#5c9ead`, font-bold
- Horizontal scroll jika overflow
- Auto-hide setelah item diklik (`closeRibbon()` dipanggil setelah `openPrimaryTab()`)
- Tidak ada collapse/expand button
- Tidak auto-hide di form view karena ribbon adalah overlay
- Jika module belum punya menu → render ribbon kosong (height 64px)
- Ribbon per module:
  - Master Data: Akun (COA), Kontak, Produk, Satuan, Gudang, Syarat Bayar, Departemen, Proyek, Pemetaan Akun
  - Buku Besar: Jurnal Umum, Periode Akuntansi, Tahun Fiskal
  - Kas & Bank: Penerimaan Kas, Pengeluaran Kas, Transfer, Rekonsiliasi
  - Penjualan: Penawaran, Sales Order, Pengiriman, Proforma, Invoice, Penerimaan, Retur, Piutang
  - Pembelian: Permintaan, Purchase Order, Penerimaan Brg, Tagihan, Pembayaran, Retur, Hutang
  - Persediaan: Saldo Stok, Mutasi Stok, Penyesuaian, Opname
  - Aktiva Tetap: (belum diimplementasi — placeholder, ribbonItems kosong)
  - Daftar Laporan: Buku Besar, Trial Balance, Laba Rugi, Neraca, Arus Kas, AR Aging, AP Aging
  - Pengaturan: (belum diimplementasi — placeholder, ribbonItems kosong)
- File: `src/components/shared/layout/RibbonPanel.tsx`

### ISSUE-1C-04 — WorkspaceLayout component
- Layout untuk list/workspace view
- Content area di bawah Topbar + Ribbon, di kanan FilterSidebar
- Slot: `title`, `breadcrumb`, `action` (tombol tambah baru), `children` (DataTable)
- File: `src/components/shared/layout/WorkspaceLayout.tsx`

### ISSUE-1C-05 — FormLayout component
- Layout untuk form view — full width (FilterSidebar hidden)
- Ribbon tidak perlu diatur dari FormLayout
- Ribbon adalah overlay yang dikontrol sepenuhnya oleh Topbar + useTabStore
- Slot: `title`, `documentNumber`, `status` (badge), `breadcrumb`, `children`
- File: `src/components/shared/layout/FormLayout.tsx`

### ISSUE-1C-06 — FixedBottomBar component
- Height: 56px, background `#ffffff`, border-top `1px solid #d9e2e5`
- Position: `fixed bottom-0 z-40`
- Layout: kiri — status info / nomor dokumen, kanan — action buttons
- **HANYA** tampil di form view
- Tidak tampil jika dokumen LOCKED atau void
- File: `src/components/shared/layout/FixedBottomBar.tsx`

### ISSUE-1C-07 — FilterSidebar component
- Width: 220px, background `#ffffff`, border-right `1px solid #d9e2e5`
- Position: fixed left, di bawah Ribbon
- **TAMPIL** di list/workspace view
- **HIDDEN** di form view
- Toggle collapse — simpan state di `useTabStore.isSidebarCollapsed`
- Konten filter bersifat contextual (diisi oleh masing-masing modul)
- File: `src/components/shared/layout/FilterSidebar.tsx`

### ISSUE-1C-08 — PrimaryTabs component
- Always visible karena Dashboard adalah tab pinned default
- Dashboard pinned di posisi pertama
- Dashboard tidak bisa ditutup dan tidak punya close button (×)
- Default aktif saat login / setelah navigate ke `/`
- Klik Dashboard di Primary Tabs TIDAK membuka ribbon
- File: `src/components/shared/layout/PrimaryTabs.tsx`

### ISSUE-1C-09 — SecondaryTabs component
- `return null` saat Dashboard aktif
- Muncul normal saat menu lain aktif
- Tab "Daftar" tetap pinned untuk menu non-Dashboard
- File: `src/components/shared/layout/SecondaryTabs.tsx`

### ISSUE-1C-10 — Dashboard shell behavior
- Dashboard dirender lewat `useTabStore` tab `dashboard`, bukan Topbar module tab
- paddingTop Dashboard: 104px
- Tidak ada Secondary Tabs
- Tidak ada Filter Sidebar
- Tidak ada Fixed Bottom Bar
- Tidak ada ribbon saat klik Dashboard di Primary Tabs
- Navigasi ke Dashboard memakai `navigate('/')`, bukan `navigate('/dashboard')`
