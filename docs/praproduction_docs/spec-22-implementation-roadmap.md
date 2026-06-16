# 22 — Implementation Roadmap

> Dokumen ini adalah panduan urutan implementasi untuk Claude Code.
> Baca dokumen ini sebelum memulai task apapun.
> Setiap phase harus selesai sepenuhnya sebelum lanjut ke phase berikutnya.

---

## Prinsip Implementasi

1. **Phase harus berurutan** — jangan mulai Phase 3 sebelum Phase 1 dan 2 selesai
2. **Satu sesi = satu sub-phase** — jangan campur task antar sub-phase
3. **Test setiap sub-phase** — pastikan `npm run dev` tidak ada error sebelum lanjut
4. **Baca docs dulu** — setiap sesi Claude Code wajib baca dokumen relevan sebelum coding
5. **Commit setiap sub-phase** — gunakan conventional commits

---

## Dependensi Antar Phase

```
Phase 1 (Foundation)
    ↓
Phase 2 (Master Data) ← dibutuhkan oleh semua modul transaksi
    ↓
Phase 3 (Sales)
    ↓           ↘
Phase 4 (Purchase)  Phase 5 (Inventory)
    ↓           ↙
Phase 6 (Accounting & Reports)
    ↓
Phase 7 (Dashboard & Settings)
```

Phase 3, 4, 5 bisa dikerjakan paralel setelah Phase 2 selesai.
Phase 6 butuh Phase 3, 4, 5 selesai.
Phase 7 butuh semua phase selesai.

---

## PHASE 1 — Foundation & Auth

**Estimasi:** 1-2 minggu
**Dokumen referensi:**
- `docs/CLAUDE.md`
- `docs/01-project-context.md`
- `docs/02-stack-and-dependencies.md`
- `docs/03-folder-structure.md`
- `docs/04-design-tokens.md`
- `docs/05-layout-and-navigation.md`
- `docs/06-responsive-rules.md`
- `docs/07-component-library.md`
- `docs/11-permission-rules.md`
- `docs/12-api-integration.md`
- `docs/14-notification-rules.md`
- `docs/17-auth-and-company.md`
- `docs/18-onboarding-wizard.md`

### Sub-phase 1A — Project Setup

**Linear issues:** semua issue label `setup` di Phase 1

```
☐ Initialize React + Vite + TypeScript
☐ Install semua dependencies
☐ Setup Tailwind CSS + design tokens
☐ Setup Shadcn/ui + install semua komponen
☐ Setup path alias @/
☐ Buat struktur folder src/
☐ Buat file types global (api.types.ts, auth.types.ts)
☐ Buat lib/utils.ts (cn, formatCurrency, formatDate, formatTimeAgo)
☐ Buat lib/constants.ts (PAGE_SIZES, STATUS_LABELS)
☐ Setup Axios instance (http.ts)
☐ Setup Zustand stores (useAuthStore, useCompanyStore, useUIStore)
☐ Setup React Router v6
☐ Setup root App (main.tsx dengan QueryClient, ToastProvider, ErrorBoundary)
☐ Buat .env.example
```

**Verifikasi:** `npm run dev` berjalan tanpa error, halaman kosong tampil.

---

### Sub-phase 1B — Auth Pages

**Linear issues:** issue label `form` dan `ui-component` di Phase 1 terkait auth

```
☐ Login Page (split screen)
☐ Company Picker Page (card grid)
☐ Auth flow post-login (1 company → dashboard, 2+ → picker)
☐ Route Guards (ProtectedRoute)
☐ Session Timeout (idle timer + warning dialog)
☐ usePermission hook
☐ PermissionGuard component
```

**Verifikasi:** Login berhasil, token tersimpan, redirect benar.

---

### Sub-phase 1C — App Shell & Layout

**Linear issues:** issue label `ui-component` terkait layout

```
☐ AppShell component (root layout)
☐ Topbar component (module tabs + user dropdown)
☐ RibbonPanel component (contextual per module)
☐ WorkspaceLayout component (list view)
☐ FormLayout component (form view, full width)
☐ FixedBottomBar component (action buttons)
☐ FilterSidebar component (contextual filter panel)
```

**Verifikasi:** Navigasi antar module berfungsi, ribbon berubah sesuai module aktif.

---

### Sub-phase 1D — Shared Components

**Linear issues:** semua `ui-component` shared

```
☐ DocumentStatusBadge
☐ DataTable (dengan checkbox sticky, pagination, bulk action)
☐ TablePagination (25/50/100)
☐ BulkActionBar
☐ SearchableSelect (dropdown searchable, debounce 300ms)
☐ FormSection (2-column grid)
☐ LineItemsTable (base)
☐ FormSummary
☐ DocumentLockedBanner
☐ VoidConfirmDialog
☐ DocumentActionBar
☐ useDocumentActions hook
☐ Toast system (useToast hook)
☐ EmptyState
☐ SystemGeneratedBadge
```

**Verifikasi:** Render semua komponen di halaman test tanpa error.

---

### Sub-phase 1E — Error Pages & Onboarding

**Linear issues:** error pages + onboarding

```
☐ Halaman 403
☐ Halaman 404
☐ Halaman 500
☐ Halaman Network Error
☐ Halaman Maintenance
☐ ErrorBoundary component
☐ Onboarding Wizard layout (sidebar vertikal 6 step)
☐ Step 1 — Informasi Perusahaan
☐ Step 2 — Pilih Template COA
☐ Step 3 — Account Mapping
☐ Step 4 — Master Data Dasar
☐ Step 5 — Opening Balance
☐ Step 6 — Selesai
```

**Verifikasi:** Semua error page tampil. Wizard bisa navigasi antar step.

---

**Phase 1 Commit:**
```
feat(foundation): complete phase 1 — auth, layout, shared components
```

---

## PHASE 2 — Master Data

**Estimasi:** 1 minggu
**Dokumen referensi:**
- `docs/CLAUDE.md`
- `docs/08-form-architecture.md`
- `docs/09-table-and-list.md`
- `docs/10-document-workflow.md`
- `docs/13-filter-and-search.md`
- `docs/15-module-patterns.md`
- `docs/backend/frontend-api-contract.md` (section Master Data)

### Sub-phase 2A — COA & Kontak

```
☐ COA List Page
☐ COA Form Page (create + edit + activate/deactivate)
☐ Kontak List Page
☐ Kontak Form Page
```

### Sub-phase 2B — Produk & Inventory Master

```
☐ Produk List Page
☐ Produk Form Page
☐ Kategori Produk List & Form
☐ Satuan List & Form
☐ Gudang List & Form
```

### Sub-phase 2C — Supporting Master Data

```
☐ Payment Terms List & Form
☐ Departemen List & Form
☐ Proyek List & Form
☐ Account Mapping Settings Page
```

**Verifikasi:** CRUD semua master data berfungsi, SearchableSelect bisa cari data master.

**Phase 2 Commit:**
```
feat(master-data): complete phase 2 — all master data modules
```

---

## PHASE 3 — Sales Module

**Estimasi:** 2-3 minggu
**Dokumen referensi:**
- `docs/CLAUDE.md`
- `docs/08-form-architecture.md`
- `docs/09-table-and-list.md`
- `docs/10-document-workflow.md`
- `docs/11-permission-rules.md`
- `docs/13-filter-and-search.md`
- `docs/15-module-patterns.md`
- `docs/backend/frontend-api-contract.md` (section Sales)
- `docs/backend/04-sales-workflow-audit.md`
- `docs/backend/08-business-rules-and-validation-map.md`

### Sub-phase 3A — Sales Quotation & Order

```
☐ Sales Quotation List Page
☐ Sales Quotation Form Page
☐ Sales Order List Page
☐ Sales Order Form Page (create + from quotation)
☐ Source Document Picker component
```

### Sub-phase 3B — Delivery Order & Proforma

```
☐ Delivery Order List Page
☐ Delivery Order Form Page (deliver confirmation dialog)
☐ Proforma Invoice List Page
☐ Proforma Invoice Form Page
```

### Sub-phase 3C — Sales Invoice

```
☐ Sales Invoice List Page
☐ Sales Invoice Form Page
☐ Create from SO / DO / Proforma
☐ Amount tracking (grand total, paid, balance due)
☐ Document workflow rules (edit mode, void chain)
```

### Sub-phase 3D — Receipt, Deposit & Return

```
☐ Customer Deposit List & Form
☐ Deposit allocation ke invoice
☐ Sales Receipt List & Form
☐ Sales Return List & Form (from invoice + from DO)
```

### Sub-phase 3E — AR Summary

```
☐ AR Customer Summary Page
☐ AR Aging Page
☐ AR Reconciliation Page
☐ Customer Ledger Page
☐ Invoice Ledger Page
```

**Verifikasi:** Full sales flow berfungsi: Quotation → SO → DO → Invoice → Receipt.

**Phase 3 Commit:**
```
feat(sales): complete phase 3 — full sales workflow
```

---

## PHASE 4 — Purchase Module

**Estimasi:** 2 minggu
**Dokumen referensi:**
- `docs/backend/frontend-api-contract.md` (section Purchase)
- `docs/backend/05-purchase-workflow-audit.md`
- `docs/backend/08-business-rules-and-validation-map.md`
- Semua docs Phase 3 yang relevan

### Sub-phase 4A — Purchase Request & Order

```
☐ Purchase Request List Page
☐ Purchase Request Form Page
☐ Purchase Order List Page
☐ Purchase Order Form Page (create + from PR)
```

### Sub-phase 4B — Goods Receipt & Vendor Bill

```
☐ Goods Receipt List Page
☐ Goods Receipt Form Page (receive confirmation dialog)
☐ Vendor Bill List Page
☐ Vendor Bill Form Page (from PO + from GR)
```

### Sub-phase 4C — Payment, Deposit & Return

```
☐ Vendor Deposit List & Form
☐ Deposit allocation ke bill
☐ Vendor Payment List & Form
☐ Purchase Return List & Form (from bill + from GR)
```

### Sub-phase 4D — AP Summary

```
☐ AP Vendor Summary Page
☐ AP Aging Page
☐ AP Reconciliation Page
☐ Vendor Ledger Page
☐ Bill Ledger Page
```

**Verifikasi:** Full purchase flow: PR → PO → GR → Bill → Payment.

**Phase 4 Commit:**
```
feat(purchase): complete phase 4 — full purchase workflow
```

---

## PHASE 5 — Inventory Module

**Estimasi:** 1 minggu
**Dokumen referensi:**
- `docs/backend/frontend-api-contract.md` (section Inventory)
- `docs/backend/06-inventory-workflow-audit.md`

### Sub-phase 5A — Stock Balance & Movement

```
☐ Stock Balance List Page
☐ Stock Balance Detail (per product + warehouse)
☐ Stock Movement List Page
☐ Stock Movement Form (manual movement)
☐ Stock Movement post/void actions
```

### Sub-phase 5B — Adjustment & Opname

```
☐ Stock Adjustment List Page
☐ Stock Adjustment Form (approve/post/void)
☐ Stock Opname List Page
☐ Stock Opname Form (generate lines, update count, finalize)
```

**Verifikasi:** Stock balance update setelah movement. Opname finalize berfungsi.

**Phase 5 Commit:**
```
feat(inventory): complete phase 5 — inventory management
```

---

## PHASE 6 — Accounting & Reports

**Estimasi:** 2-3 minggu
**Dokumen referensi:**
- `docs/backend/frontend-api-contract.md` (section Journal, Reports, Cash Bank)
- `docs/backend/07-accounting-and-reporting-audit.md`
- `docs/16-reports-module.md`

### Sub-phase 6A — Manual Journal & Accounting

```
☐ Manual Journal List Page
☐ Manual Journal Form (balanced validation, control account blocked)
☐ Fiscal Year Management
☐ Period Lock
```

### Sub-phase 6B — Cash & Bank

```
☐ Cash Receipt List & Form
☐ Cash Payment List & Form
☐ Bank Transfer List & Form
☐ Bank Reconciliation List & Form
```

### Sub-phase 6C — Report Infrastructure

```
☐ Report navigation (ribbon + grid card)
☐ Report Filter Page — Tab Parameter
☐ Report Filter Page — Tab Filter & Kolom
☐ Filter collapse → compact bar
☐ Print CSS @media print
☐ Export PDF (server-side)
☐ Export Excel (server-side)
```

### Sub-phase 6D — Financial Statement Reports

```
☐ Neraca (Balance Sheet) — print preview renderer
☐ Laba Rugi (P&L) — print preview renderer
☐ Arus Kas (Cash Flow) — print preview renderer
☐ Neraca Saldo (Trial Balance) — print preview renderer
☐ Ringkasan Keuangan (Financial Summary)
```

### Sub-phase 6E — Tabular Reports

```
☐ Buku Besar (filter by akun)
☐ AR Aging report
☐ AP Aging report
☐ Rekonsiliasi AR, AP, Inventory
☐ Saldo Stok, Mutasi Stok, Kartu Stok
☐ Valuasi Inventory, Low Stock, Negative Stock
☐ Daftar Transaksi Penjualan & Pembelian
☐ Preset Analysis per laporan
```

**Verifikasi:** Semua laporan tampil dengan data benar. Export PDF dan Excel berfungsi.

**Phase 6 Commit:**
```
feat(accounting): complete phase 6 — accounting, cash bank, reports
```

---

## PHASE 7 — Dashboard & Settings

**Estimasi:** 1 minggu
**Dokumen referensi:**
- `docs/19-settings-module.md`
- `docs/20-dashboard.md`
- `docs/21-error-pages-and-print-export.md`

### Sub-phase 7A — Dashboard

```
☐ Dashboard Page layout
☐ KPI Cards (Piutang, Hutang, Kas & Bank, Laba Bulan Ini)
☐ Dokumen Pending alert cards
☐ Grafik Penjualan vs Pembelian (Recharts LineChart)
☐ Grafik Arus Kas (Recharts BarChart)
☐ Aktivitas Terbaru list
```

### Sub-phase 7B — Settings

```
☐ Settings navigation (ribbon)
☐ Pengaturan Perusahaan
☐ Pengaturan Transaksi (auto-post, approval, format nomor, timeout)
☐ Standar Akun (account mapping)
☐ Akun & Periode
☐ Pengguna List & Form
☐ Role & Akses
☐ Preferensi Saya
```

**Verifikasi:** Dashboard load dengan data real. Settings tersimpan dan berpengaruh ke app.

**Phase 7 Commit:**
```
feat(dashboard): complete phase 7 — dashboard and settings
```

---

## Checklist Sebelum Mulai Setiap Sub-phase

```
☐ Pull latest dari remote
☐ Buat branch baru: git checkout -b feat/phase-{X}{Y}-{description}
☐ Baca semua dokumen referensi yang disebutkan
☐ Cek Linear untuk issue yang akan dikerjakan
☐ Pastikan npm run dev berjalan tanpa error
```

## Checklist Setelah Selesai Setiap Sub-phase

```
☐ npm run dev — tidak ada error
☐ npm run build — tidak ada TypeScript error
☐ Semua issue Linear di sub-phase ini di-mark Done
☐ Commit dengan conventional commit message
☐ Push ke remote
☐ Update Linear milestone progress
```

---

## Urutan Prioritas Jika Waktu Terbatas

Jika perlu deliver sebagian dulu, urutan minimum viable product:

```
1. Phase 1 (wajib — fondasi semua)
2. Phase 2 (wajib — master data dibutuhkan semua modul)
3. Phase 3 Sales Invoice saja (3C) — fitur paling kritis untuk agen gas
4. Phase 4 Vendor Bill saja (4B) — AP dasar
5. Phase 7A Dashboard — ringkasan untuk owner
6. Lanjutkan phase lainnya
```
