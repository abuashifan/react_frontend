# 05 — Layout & Navigation

## App Shell Structure

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR (52px, background #326273)                           │
│  [Logo] [Dashboard] [Penjualan] [Pembelian] [Inventory] ...  │
├──────────────────────────────────────────────────────────────┤
│  RIBBON PANEL (64px, background #ffffff)                     │
│  [Icon+Label] [Icon+Label] [Icon+Label] ...                  │
│  (collapsed saat tidak ada module aktif atau di form view)   │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                  │
│  FILTER    │  CONTENT AREA                                    │
│  SIDEBAR   │  - List view: workspace table                    │
│  (220px)   │  - Form view: full width (sidebar hidden)        │
│            │                                                  │
│            │                                                  │
│            ├─────────────────────────────────────────────────┤
│            │  FIXED BOTTOM BAR (60px) — hanya di form view   │
└────────────┴─────────────────────────────────────────────────┘
```

---

## Zone 1 — Topbar

### Spesifikasi
- Height: **52px**
- Background: **#326273** (sidebar token)
- Position: `fixed top-0 left-0 right-0 z-50`

### Konten Topbar

**Kiri:**
- Logo mark (rounded square #5c9ead, 24x24)
- Nama produk "Seaside Escape" — text white, font-semibold, 14px

**Tengah/Kiri (Module Tabs):**
- Tab: Dashboard, Penjualan, Pembelian, Persediaan, Akuntansi, Kas & Bank, Laporan
- Default: text `rgba(255,255,255,0.7)`
- Active: text white, border-bottom 2px `#e39774`
- Hover: text white, background `rgba(255,255,255,0.08)`
- Padding: `px-4 py-3`

**Kanan:**
- Nama perusahaan aktif (text white, text-sm, muted)
- Avatar user (circle, 32px)
- Dropdown: ganti perusahaan, profil, logout

### Behavior
- Topbar selalu visible — tidak pernah disembunyikan
- Klik module tab → Ribbon Panel muncul/berubah
- Active module tab persistent selama di workspace tersebut

---

## Zone 2 — Ribbon Panel

### Spesifikasi
- Height: **64px**
- Background: **#ffffff**
- Border-bottom: 1px solid `#d9e2e5`
- Position: `fixed top-[52px] left-0 right-0 z-40`

### Konten Ribbon

Setiap module punya set menu item sendiri. Layout: horizontal scroll jika overflow.

**Item Format:**
```
┌──────────────┐
│     Icon     │  ← 20px icon (Lucide)
│    Label     │  ← 11px, font-medium
└──────────────┘
  Width: 72-88px, Height: 100%
```

**States:**
- Default: icon `#64748b`, text `#64748b`, background transparent
- Hover: background `#f8fbfc`, icon `#5c9ead`, text `#326273`
- Active: background `#EFF9FB`, icon `#5c9ead`, text `#326273`, font-bold, border-bottom 2px `#5c9ead`

### Ribbon Menu per Module

**Penjualan:**
```
[Penawaran] [Sales Order] [Pengiriman] [Proforma] [Invoice] [Penerimaan] [Retur] [Piutang]
```

**Pembelian:**
```
[Permintaan] [Purchase Order] [Penerimaan Brg] [Tagihan] [Pembayaran] [Retur] [Hutang]
```

**Persediaan:**
```
[Saldo Stok] [Mutasi Stok] [Penyesuaian] [Opname]
```

**Akuntansi:**
```
[Jurnal Umum] [Periode Akuntansi] [Tahun Fiskal]
```

**Kas & Bank:**
```
[Penerimaan Kas] [Pengeluaran Kas] [Transfer] [Rekonsiliasi]
```

**Laporan:**
```
[Buku Besar] [Trial Balance] [Laba Rugi] [Neraca] [Arus Kas] [AR Aging] [AP Aging]
```

**Master Data:**
```
[Akun (COA)] [Kontak] [Produk] [Satuan] [Gudang] [Syarat Bayar] [Departemen] [Proyek] [Pemetaan Akun]
```

### Behavior
- Ribbon **hanya muncul** saat ada active module
- Di **form view**: ribbon di-hide (user fokus ke form)
- Klik item ribbon → navigate ke workspace list
- Ribbon bisa di-collapse manual via toggle button (simpan state di UIStore)

---

## Zone 3A — Filter Sidebar

### Spesifikasi
- Width: **220px**
- Background: **#ffffff**
- Border-right: 1px solid `#d9e2e5`
- Position: fixed left, di bawah ribbon

### Visibility Rules
- **TAMPIL**: di list/workspace view
- **TERSEMBUNYI**: di form view (create/edit/detail)
- Bisa di-toggle collapse (simpan state di UIStore)

### Konten Filter
Filter bersifat contextual — lihat `13-filter-and-search.md` untuk detail per workspace.

---

## Zone 3B — Content Area

### List View
```
Content Area
├── Breadcrumb + Page Title
├── Action Bar (Search global + Tombol tambah)
└── DataTable (horizontal scroll enabled)
```

### Form View
```
Content Area (full width, sidebar hidden)
├── Breadcrumb + Document Title + Status Badge
├── Form Header (2-column grid)
├── Line Items Table (horizontal scroll)
├── Form Summary (right-aligned)
└── [Fixed Bottom Bar — action buttons]
```

---

## Zone 4 — Fixed Bottom Bar (Form Only)

### Spesifikasi
- Height: **60px**
- Background: **#ffffff**
- Border-top: 1px solid `#d9e2e5`
- Position: `fixed bottom-0 left-0 right-0 z-40`
- Padding: `px-6`

### Layout
```
[Kiri: Status info / Document number]    [Kanan: Action buttons]
```

### Visibility
- **HANYA** muncul di form view
- Tidak muncul di list/workspace view
- Tidak muncul jika document LOCKED (posted + ada dependence posted)
- Tidak muncul jika document void

Detail button logic → `10-document-workflow.md`

---

## Navigation State (UIStore)

```typescript
interface UIState {
  activeModule: string | null      // 'sales' | 'purchase' | ...
  activeRibbonItem: string | null  // 'invoices' | 'orders' | ...
  isRibbonCollapsed: boolean
  isSidebarCollapsed: boolean
}
```

---

## Layout Components

```typescript
// AppShell.tsx — root layout wrapper
// Topbar.tsx — module tabs + user info
// RibbonPanel.tsx — contextual menu per module
// FilterSidebar.tsx — contextual filter panel
// WorkspaceLayout.tsx — list view layout
// FormLayout.tsx — form view layout (full width)
// FixedBottomBar.tsx — action buttons container
```

### Penggunaan di Page

```typescript
// List page
export function SalesInvoiceListPage() {
  return (
    <WorkspaceLayout
      title="Sales Invoice"
      action={<CreateInvoiceButton />}
    >
      <DataTable ... />
    </WorkspaceLayout>
  )
}

// Form page
export function SalesInvoiceFormPage() {
  return (
    <FormLayout
      title="Sales Invoice"
      documentNumber="INV-2026-001"
      status="draft"
    >
      <InvoiceForm />
    </FormLayout>
  )
}
```
