# design-I2 Implementation Plan — Reports Navigation Restructure

**Dibuat:** 2026-06-28
**Diperbarui:** 2026-06-28 (revisi: sidebar → ribbon category)
**Referensi:** `design-I2-reports-navigation-structure.md`
**Status:** Panduan implementasi manual — step by step

---

## Prasyarat

> ⚠️ **Dependency:** Design-I2 §9: *"Jangan ubah navigasi sebelum adapter dan filter
> semua laporan yang ada stabil (Phase 36 selesai)."*
>
> Pastikan Phase 36 (A13-232 s/d A13-238) **selesai dan stabil** sebelum mulai.

---

## Konsep Baru: Ribbon Category (bukan Sidebar)

```
SEBELUM (12 ribbon items = 1 per laporan):
┌─────────────────────────────────────────────────────────────┐
│ Ribbon: [Buku Besar] [Buku Besar/Akun] [Trial Balance] ... │  ← 12 ikon
└─────────────────────────────────────────────────────────────┘

SESUDAH (~10 ribbon items = 1 per kategori):
┌─────────────────────────────────────────────────────────────┐
│ Ribbon: [Keuangan] [Buku Besar] [Penjualan] [Pembelian] ...│  ← ~10 ikon
└─────────────────────────────────────────────────────────────┘
         │
         └── klik → buka primary tab + secondary tab "Daftar"
                    └── tampil ReportDomainPanel (grid card laporan di kategori itu)
                         │
                         └── klik card → buka secondary tab baru
                                         └── tampil halaman laporan spesifik
```

### Alur navigasi

```
1. Topbar module = "Daftar Laporan"
2. Ribbon tampil 10 kategori (Keuangan, Buku Besar, Penjualan, dll)
3. Klik kategori "Laporan Keuangan" →
   - Primary tab terbuka: "Laporan Keuangan"
   - Secondary tab "Daftar" terbuka → render ReportCategoryPage
     → grid cards: Neraca Saldo, Laba Rugi, Neraca, Arus Kas, Ringkasan
4. Klik card "Neraca Saldo" →
   - Secondary tab baru "Neraca Saldo" terbuka (masih di primary tab yang sama)
   - Navigate ke /reports/trial-balance → render TrialBalancePage
5. User bisa switch antar secondary tabs (Daftar ↔ Neraca Saldo ↔ ...)
6. Klik kategori lain di ribbon → buka primary tab baru dengan "Daftar"-nya sendiri
```

### Yang TIDAK berubah

- **AppShell, Topbar, RibbonPanel, PrimaryTabs, SecondaryTabs** — semua tetap
- **Route halaman laporan existing** — `/reports/trial-balance`, dll tetap sama
- **Halaman laporan existing** — TrialBalancePage, ProfitLossPage, dll tidak diubah
- **API services** — reportsApi.ts tidak diubah (kecuali tambahan untuk halaman baru)

---

## Phase 1 — Data Kategori + Halaman Domain Panel

### 1A. BUAT `src/modules/reports/constants/reportCategories.ts`

Single source of truth: daftar kategori dan laporan di dalamnya.

```typescript
// src/modules/reports/constants/reportCategories.ts

export interface ReportEntry {
  id: string
  title: string
  description: string
  path: string
  permission?: string
  comingSoon?: boolean
}

export interface ReportDomain {
  id: string
  label: string
  /** Path pendek untuk route category, contoh: "financial" → /reports/financial */
  categoryPath: string
  reports: ReportEntry[]
}

export const REPORT_DOMAINS: ReportDomain[] = [
  {
    id: 'financial',
    label: 'Laporan Keuangan',
    categoryPath: 'financial',
    reports: [
      { id: 'trial-balance', title: 'Neraca Saldo', description: 'Saldo debit & kredit semua akun per periode', path: '/reports/trial-balance' },
      { id: 'profit-loss', title: 'Laba Rugi', description: 'Pendapatan, beban, dan laba bersih per periode', path: '/reports/profit-loss' },
      { id: 'balance-sheet', title: 'Neraca', description: 'Aset, kewajiban, dan ekuitas per tanggal', path: '/reports/balance-sheet' },
      { id: 'cash-flow', title: 'Arus Kas', description: 'Arus masuk dan keluar kas per periode', path: '/reports/cash-flow' },
      { id: 'financial-summary', title: 'Ringkasan Keuangan', description: 'Indikator keuangan utama sekilas', path: '/reports/financial-summary' },
    ],
  },
  {
    id: 'gl',
    label: 'Buku Besar',
    categoryPath: 'gl',
    reports: [
      { id: 'general-ledger', title: 'Buku Besar', description: 'Ringkasan semua akun dengan saldo berjalan', path: '/reports/general-ledger' },
      { id: 'trial-balance', title: 'Neraca Saldo', description: 'Saldo debit & kredit semua akun', path: '/reports/trial-balance' },
      { id: 'account-ledger', title: 'Buku Besar per Akun', description: 'Rincian transaksi per akun', path: '/reports/account-ledger' },
      { id: 'all-journals', title: 'Semua Jurnal', description: 'Daftar seluruh jurnal umum', path: '', comingSoon: true },
    ],
  },
  {
    id: 'sales',
    label: 'Laporan Penjualan',
    categoryPath: 'sales',
    reports: [
      { id: 'sales-per-customer', title: 'Penjualan Per Pelanggan', description: 'Ringkasan omset per pelanggan', path: '', comingSoon: true },
      { id: 'sales-per-product', title: 'Penjualan Per Barang', description: 'Omset penjualan per produk', path: '', comingSoon: true },
      { id: 'sales-invoice-list', title: 'Daftar Faktur Penjualan', description: 'Seluruh faktur penjualan', path: '', comingSoon: true },
      { id: 'sales-returns', title: 'Retur Penjualan', description: 'Daftar retur penjualan', path: '', comingSoon: true },
    ],
  },
  {
    id: 'purchase',
    label: 'Laporan Pembelian',
    categoryPath: 'purchase',
    reports: [
      { id: 'purchase-per-vendor', title: 'Pembelian Per Pemasok', description: 'Ringkasan pembelian per pemasok', path: '', comingSoon: true },
      { id: 'purchase-per-product', title: 'Pembelian Per Barang', description: 'Pembelian per produk', path: '', comingSoon: true },
      { id: 'purchase-bill-list', title: 'Daftar Faktur Pembelian', description: 'Seluruh faktur pembelian', path: '', comingSoon: true },
      { id: 'purchase-returns', title: 'Retur Pembelian', description: 'Daftar retur pembelian', path: '', comingSoon: true },
    ],
  },
  {
    id: 'ar',
    label: 'Akun Piutang (AR)',
    categoryPath: 'ar',
    reports: [
      { id: 'ar-aging', title: 'Umur Piutang (AR Aging)', description: 'Analisis umur piutang per pelanggan', path: '/reports/ar-aging' },
      { id: 'ar-unpaid', title: 'Faktur Belum Lunas', description: 'Daftar faktur penjualan yang belum lunas', path: '', comingSoon: true },
      { id: 'ar-customer-ledger', title: 'Buku Pembantu Piutang', description: 'Ledger per pelanggan', path: '/sales/ar/summary' },
      { id: 'ar-reconciliation', title: 'Rekonsiliasi AR', description: 'Cocokkan GL vs subledger piutang', path: '/reports/reconciliation' },
    ],
  },
  {
    id: 'ap',
    label: 'Akun Hutang (AP)',
    categoryPath: 'ap',
    reports: [
      { id: 'ap-aging', title: 'Umur Hutang (AP Aging)', description: 'Analisis umur hutang per pemasok', path: '/reports/ap-aging' },
      { id: 'ap-unpaid', title: 'Hutang Belum Lunas', description: 'Daftar tagihan yang belum dibayar', path: '', comingSoon: true },
      { id: 'ap-vendor-ledger', title: 'Buku Pembantu Hutang', description: 'Ledger per pemasok', path: '/purchase/ap/summary' },
      { id: 'ap-reconciliation', title: 'Rekonsiliasi AP', description: 'Cocokkan GL vs subledger hutang', path: '/reports/reconciliation' },
    ],
  },
  {
    id: 'reconciliation',
    label: 'Rekonsiliasi',
    categoryPath: 'reconciliation',
    reports: [
      { id: 'reconciliation', title: 'Rekonsiliasi', description: 'AR · AP · Inventory · GRNI · Deposits', path: '/reports/reconciliation' },
    ],
  },
  {
    id: 'inventory',
    label: 'Persediaan',
    categoryPath: 'inventory',
    reports: [
      { id: 'stock-report', title: 'Laporan Stok', description: 'Saldo, mutasi, dan kartu stok per produk', path: '/reports/stock' },
      { id: 'inventory-analysis', title: 'Analisis Inventori', description: 'Valuasi, stok rendah, dan stok negatif', path: '/reports/inventory-analysis' },
      { id: 'inventory-aging', title: 'Umur Persediaan', description: 'Analisis umur barang di gudang', path: '', comingSoon: true },
    ],
  },
  {
    id: 'fixed-assets',
    label: 'Aktiva Tetap',
    categoryPath: 'fixed-assets',
    reports: [
      // Halaman ada di modul fixed-assets; link langsung ke sana
      { id: 'fa-register', title: 'Daftar Aktiva Tetap', description: 'Register seluruh aktiva tetap', path: '/fixed-assets/reports/register' },
      { id: 'fa-depreciation', title: 'Depresiasi', description: 'Laporan depresiasi per periode', path: '/fixed-assets/reports/depreciation' },
      { id: 'fa-disposals', title: 'Disposal', description: 'Aktiva yang dihapus/dijual', path: '/fixed-assets/reports/disposals' },
      { id: 'fa-reconciliation', title: 'Rekonsiliasi Aktiva', description: 'Cocokkan GL vs register aktiva', path: '/fixed-assets/reports/reconciliation' },
    ],
  },
  {
    id: 'cash-bank',
    label: 'Kas & Bank',
    categoryPath: 'cash-bank',
    reports: [
      { id: 'account-statement', title: 'Mutasi Rekening', description: 'Laporan mutasi per rekening kas/bank', path: '/reports/account-statement', comingSoon: true },
    ],
  },
  {
    id: 'tax',
    label: 'Laporan Pajak',
    categoryPath: 'tax',
    reports: [
      { id: 'ppn-masukan', title: 'PPN Masukan', description: 'Daftar PPN masukan per periode', path: '', comingSoon: true },
      { id: 'ppn-keluaran', title: 'PPN Keluaran', description: 'Daftar PPN keluaran per periode', path: '', comingSoon: true },
    ],
  },
]

/** Map categoryPath → ReportDomain untuk lookup cepat */
export const DOMAIN_BY_PATH: Record<string, ReportDomain> =
  Object.fromEntries(REPORT_DOMAINS.map((d) => [d.categoryPath, d]))

/** Domain default saat user pertama kali buka /reports */
export const DEFAULT_DOMAIN = 'financial'
```

---

### 1B. BUAT `src/modules/reports/components/ReportDomainPanel.tsx`

Komponen grid card laporan untuk satu kategori. Dipakai oleh `ReportCategoryPage`.

```typescript
// src/modules/reports/components/ReportDomainPanel.tsx

import { useNavigate } from 'react-router-dom'
import { REPORT_DOMAINS, type ReportEntry } from '../constants/reportCategories'

interface Props {
  domainId: string
}

export function ReportDomainPanel({ domainId }: Props) {
  const navigate = useNavigate()
  const domain = REPORT_DOMAINS.find((d) => d.id === domainId)

  if (!domain) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-[#64748b]">
        Kategori tidak ditemukan.
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="mb-1 text-[16px] font-semibold text-[#1e293b]">
        {domain.label}
      </h2>
      <p className="mb-5 text-[12px] text-[#64748b]">
        {domain.reports.filter((r) => !r.comingSoon).length} laporan tersedia
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {domain.reports.map((report) => (
          <ReportCardItem
            key={report.id}
            report={report}
            onClick={() => {
              if (!report.comingSoon && report.path) {
                navigate(report.path)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ReportCardItem({
  report,
  onClick,
}: {
  report: ReportEntry
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={report.comingSoon}
      className={
        report.comingSoon
          ? 'flex cursor-not-allowed flex-col gap-1 rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-4 text-left opacity-50'
          : 'flex flex-col gap-1 rounded-lg border border-[#e2e8f0] bg-white p-4 text-left transition-all hover:border-[#5c9ead] hover:shadow-sm'
      }
    >
      <div className="flex items-center gap-2">
        <p className="text-[13px] font-semibold text-[#1e293b]">
          {report.title}
        </p>
        {report.comingSoon && (
          <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] text-[#94a3b8]">
            Segera
          </span>
        )}
      </div>
      <p className="text-[12px] text-[#64748b]">{report.description}</p>
    </button>
  )
}
```

---

### 1C. BUAT `src/modules/reports/pages/ReportCategoryPage.tsx`

Halaman yang me-render domain panel untuk kategori tertentu. Route: `/reports/:categoryPath`

```typescript
// src/modules/reports/pages/ReportCategoryPage.tsx

import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ReportDomainPanel } from '../components/ReportDomainPanel'
import { DOMAIN_BY_PATH } from '../constants/reportCategories'

export default function ReportCategoryPage() {
  const { categoryPath } = useParams<{ categoryPath: string }>()
  const domain = categoryPath ? DOMAIN_BY_PATH[categoryPath] : undefined

  return (
    <PermissionGuard permission="reports.view">
      <WorkspaceLayout
        title={domain?.label ?? 'Laporan'}
        breadcrumb={[{ label: 'Laporan' }, { label: domain?.label ?? '' }]}
      >
        <ReportDomainPanel domainId={domain?.id ?? 'financial'} />
      </WorkspaceLayout>
    </PermissionGuard>
  )
}
```

---

### 1D. UBAH `src/modules/reports/pages/ReportIndexPage.tsx`

**Sebelum:** Flat 3-section card grid
**Menjadi:** Redirect ke kategori default (`/reports/financial`)

```typescript
// src/modules/reports/pages/ReportIndexPage.tsx

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_DOMAIN } from '../constants/reportCategories'

export default function ReportIndexPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/reports/${DEFAULT_DOMAIN}`, { replace: true })
  }, [navigate])

  return null
}
```

> **Alternatif:** Kalau tidak mau redirect, bisa langsung render `ReportDomainPanel`
> dengan `domainId={DEFAULT_DOMAIN}`. Tapi redirect lebih bersih karena URL langsung
> mencerminkan kategori yang aktif, dan ribbon item matching bekerja dengan baik.

---

### 1E. UBAH `src/modules/reports/routes.tsx`

**Perubahan:**
1. Tambah lazy import `ReportCategoryPage`
2. Tambah route `/reports/:categoryPath` (di URUTAN TERAKHIR, setelah rute spesifik)
3. Route `/reports` tetap ke `ReportIndexPage` (redirect)
4. **PENTING:** Route `:categoryPath` HARUS di urutan terakhir karena catch-all.
   Semua rute spesifik (`/reports/trial-balance`, dll) harus di atasnya.

```typescript
/* eslint-disable react-refresh/only-export-components -- route config modules export static route arrays, not React components. */
import { lazy, type ReactElement } from 'react'
import { ProtectedRoute } from '@/router/guards'
import type { RouteObject } from 'react-router-dom'

const ReportIndexPage = lazy(() => import('./pages/ReportIndexPage'))
const ReportCategoryPage = lazy(() => import('./pages/ReportCategoryPage'))
const TrialBalancePage = lazy(() => import('./pages/TrialBalancePage'))
const ProfitLossPage = lazy(() => import('./pages/ProfitLossPage'))
const BalanceSheetPage = lazy(() => import('./pages/BalanceSheetPage'))
const CashFlowPage = lazy(() => import('./pages/CashFlowPage'))
const FinancialSummaryPage = lazy(() => import('./pages/FinancialSummaryPage'))
const GeneralLedgerPage = lazy(() => import('./pages/GeneralLedgerPage'))
const ArAgingReportPage = lazy(() => import('./pages/ArAgingReportPage'))
const ApAgingReportPage = lazy(() => import('./pages/ApAgingReportPage'))
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'))
const StockReportPage = lazy(() => import('./pages/StockReportPage'))
const InventoryAnalysisPage = lazy(() => import('./pages/InventoryAnalysisPage'))
const AccountLedgerPage = lazy(() => import('./pages/AccountLedgerPage'))

const wrap = (element: ReactElement) => (
  <ProtectedRoute permission="reports.view">{element}</ProtectedRoute>
)

export const reportsRoutes: RouteObject[] = [
  // Spesifik dulu — semua halaman laporan existing
  { path: '/reports', element: wrap(<ReportIndexPage />) },
  { path: '/reports/trial-balance', element: wrap(<TrialBalancePage />) },
  { path: '/reports/profit-loss', element: wrap(<ProfitLossPage />) },
  { path: '/reports/balance-sheet', element: wrap(<BalanceSheetPage />) },
  { path: '/reports/cash-flow', element: wrap(<CashFlowPage />) },
  { path: '/reports/financial-summary', element: wrap(<FinancialSummaryPage />) },
  { path: '/reports/general-ledger', element: wrap(<GeneralLedgerPage />) },
  { path: '/reports/ar-aging', element: wrap(<ArAgingReportPage />) },
  { path: '/reports/ap-aging', element: wrap(<ApAgingReportPage />) },
  { path: '/reports/reconciliation', element: wrap(<ReconciliationPage />) },
  { path: '/reports/stock', element: wrap(<StockReportPage />) },
  { path: '/reports/inventory-analysis', element: wrap(<InventoryAnalysisPage />) },
  { path: '/reports/account-ledger', element: wrap(<AccountLedgerPage />) },
  // Catch-all category route — HARUS di urutan TERAKHIR
  // ⚠️  Jangan tambahkan route /reports/... di bawah baris ini karena
  //     :categoryPath akan menangkap semuanya.
  { path: '/reports/:categoryPath', element: wrap(<ReportCategoryPage />) },
]
```

> **⚠️  KRITIKAL:** Route `:categoryPath` ditempatkan TERAKHIR karena bersifat
> catch-all. Semua rute spesifik (`trial-balance`, dll) harus didefinisikan dulu.
> Jika tidak, URL `/reports/trial-balance` akan ditangkap oleh `:categoryPath`
> dan `ReportCategoryPage` akan mencoba mencari domain dengan `categoryPath = "trial-balance"`
> (tidak ditemukan → error).

---

## Phase 2 — Update Ribbon Items (moduleConfig.ts)

### 2A. UBAH `src/router/moduleConfig.ts`

Ganti 12 ribbon items individual menjadi ~10 ribbon items kategori.

**File:** `src/router/moduleConfig.ts`
**Bagian yang diubah:** Hanya array `ribbonItems` untuk modul `reports` (sekitar baris 129-147)

**SEBELUM:**
```typescript
{
  id: 'reports',
  label: 'Daftar Laporan',
  path: '/reports',
  ribbonItems: [
    { id: 'general-ledger', label: 'Buku Besar', icon: BookMarked, path: '/reports/general-ledger', permission: 'reports.view' },
    { id: 'account-ledger', label: 'Buku Besar per Akun', icon: BookOpen, path: '/reports/account-ledger', permission: 'reports.view' },
    { id: 'trial-balance', label: 'Trial Balance', icon: Scale, path: '/reports/trial-balance', permission: 'reports.view' },
    { id: 'profit-loss', label: 'Laba Rugi', icon: TrendingUp, path: '/reports/profit-loss', permission: 'reports.view' },
    { id: 'balance-sheet', label: 'Neraca', icon: LayoutGrid, path: '/reports/balance-sheet', permission: 'reports.view' },
    { id: 'cash-flow', label: 'Arus Kas', icon: Droplets, path: '/reports/cash-flow', permission: 'reports.view' },
    { id: 'ar-aging', label: 'AR Aging', icon: Clock, path: '/reports/ar-aging', permission: 'reports.view' },
    { id: 'ap-aging', label: 'AP Aging', icon: Clock, path: '/reports/ap-aging', permission: 'reports.view' },
    { id: 'financial-summary', label: 'Ringkasan Keuangan', icon: BarChart3, path: '/reports/financial-summary', permission: 'reports.view' },
    { id: 'reconciliation', label: 'Rekonsiliasi', icon: RefreshCcw, path: '/reports/reconciliation', permission: 'reports.view' },
    { id: 'stock', label: 'Laporan Stok', icon: Package, path: '/reports/stock', permission: 'inventory.reports.view' },
    { id: 'inventory-analysis', label: 'Analisis Inventori', icon: Archive, path: '/reports/inventory-analysis', permission: 'inventory.reports.view' },
  ],
},
```

**SESUDAH:**
```typescript
{
  id: 'reports',
  label: 'Daftar Laporan',
  path: '/reports',
  ribbonItems: [
    { id: 'financial', label: 'Keuangan', icon: BarChart3, path: '/reports/financial', permission: 'reports.view' },
    { id: 'gl', label: 'Buku Besar', icon: BookMarked, path: '/reports/gl', permission: 'reports.view' },
    { id: 'sales', label: 'Penjualan', icon: TrendingUp, path: '/reports/sales', permission: 'reports.view' },
    { id: 'purchase', label: 'Pembelian', icon: TrendingDown, path: '/reports/purchase', permission: 'reports.view' },
    { id: 'ar', label: 'Piutang', icon: Clock, path: '/reports/ar', permission: 'reports.view' },
    { id: 'ap', label: 'Hutang', icon: Clock, path: '/reports/ap', permission: 'reports.view' },
    { id: 'reconciliation', label: 'Rekonsiliasi', icon: RefreshCcw, path: '/reports/reconciliation', permission: 'reports.view' },
    { id: 'inventory', label: 'Persediaan', icon: Package, path: '/reports/inventory', permission: 'inventory.reports.view' },
    { id: 'fixed-assets', label: 'Aktiva Tetap', icon: Building2, path: '/reports/fixed-assets', permission: 'fixed_assets.reports.view' },
    { id: 'cash-bank', label: 'Kas & Bank', icon: Landmark, path: '/reports/cash-bank', permission: 'reports.view' },
  ],
},
```

**Catatan icon:**
- Pastikan semua icon yang dipakai sudah di-import di bagian atas file
- `Building2`, `TrendingDown`, `Landmark` mungkin belum ada di import — tambahkan dari 'lucide-react'
- Icon `Clock` untuk AR dan AP bisa dibedakan dengan `ClockArrowUp` / `ClockArrowDown` kalau tersedia

**Catatan permission:**
- `fixed_assets.reports.view` sudah ada di sistem (dipakai oleh modul fixed-assets)
- `inventory.reports.view` sudah ada
- Kategori `sales` dan `purchase` pakai `reports.view` umum dulu (bisa diperhalus nanti)

---

## Phase 3 — Halaman Baru: Quick Wins (Backend Siap)

### 3A. BUAT `src/modules/reports/pages/CashBankStatementPage.tsx`

Backend: `GET /cash-bank/reports/account-statement` (sudah ada)

```typescript
// src/modules/reports/pages/CashBankStatementPage.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { ReportFilterParameter } from '../components/ReportFilterParameter'
import { ReportError } from '../components/ReportError'
import { DataTable } from '@/components/shared/table/DataTable'
import { http } from '@/services/http'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReportParams } from '../types/reports.types'
import type { ApiResponse } from '@/types/api.types'
import { createColumnHelper } from '@tanstack/react-table'

// --- Types (pindahkan ke reports.types.ts saat rapikan) ---
interface AccountStatementLine {
  date: string
  description: string
  reference: string
  debit: number
  credit: number
  balance: number
}

interface AccountStatementReport {
  account_id: number
  account_name: string
  account_code: string
  opening_balance: number
  closing_balance: number
  lines: AccountStatementLine[]
}

const columnHelper = createColumnHelper<AccountStatementLine>()

const columns = [
  columnHelper.accessor('date', { header: 'Tanggal', cell: (info) => formatDate(info.getValue()) }),
  columnHelper.accessor('description', { header: 'Keterangan' }),
  columnHelper.accessor('reference', { header: 'Referensi' }),
  columnHelper.accessor('debit', { header: 'Debit', cell: (info) => <span className="tabular-nums">{formatCurrency(info.getValue())}</span> }),
  columnHelper.accessor('credit', { header: 'Kredit', cell: (info) => <span className="tabular-nums">{formatCurrency(info.getValue())}</span> }),
  columnHelper.accessor('balance', { header: 'Saldo', cell: (info) => <span className="tabular-nums">{formatCurrency(info.getValue())}</span> }),
]

const today = new Date().toISOString().slice(0, 10)
const firstOfMonth = today.slice(0, 8) + '01'

export default function CashBankStatementPage() {
  const [params, setParams] = useState<ReportParams>({ start_date: firstOfMonth, end_date: today })
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'account-statement', activeParams],
    queryFn: () =>
      http.get<unknown, ApiResponse<AccountStatementReport>>(
        '/cash-bank/reports/account-statement',
        { params: activeParams! },
      ),
    enabled: !!activeParams,
  })

  const report = data?.data

  return (
    <WorkspaceLayout
      title="Mutasi Rekening"
      breadcrumb={[{ label: 'Laporan' }, { label: 'Kas & Bank' }, { label: 'Mutasi Rekening' }]}
    >
      <div className="space-y-4">
        <ReportFilterParameter
          params={params}
          onChange={(p) => setParams((prev) => ({ ...prev, ...p }))}
          onSubmit={() => setActiveParams({ ...params })}
          isLoading={isLoading}
          mode="range"
        />
        {isError && <ReportError onRetry={() => refetch()} />}
        {report && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard label="Saldo Awal" value={report.opening_balance} />
              <SummaryCard label="Saldo Akhir" value={report.closing_balance} />
              <SummaryCard label="Akun" value={report.account_name ?? '-'} isText />
            </div>
            <DataTable columns={columns} data={report.lines ?? []} isLoading={isLoading} />
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}

function SummaryCard({ label, value, isText }: { label: string; value: string | number; isText?: boolean }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-3">
      <p className="text-[11px] font-medium text-[#64748b]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums text-[#1e293b]">
        {isText ? value : formatCurrency(Number(value))}
      </p>
    </div>
  )
}
```

---

### 3B. UBAH `src/modules/reports/routes.tsx` — tambah route

Tambahkan lazy import dan route untuk halaman baru:

```typescript
const CashBankStatementPage = lazy(() => import('./pages/CashBankStatementPage'))

// Di array reportsRoutes, tambahkan SEBELUM :categoryPath:
{ path: '/reports/account-statement', element: wrap(<CashBankStatementPage />) },
```

---

### 3C. UBAH `src/modules/reports/constants/reportCategories.ts` — update kategori

```typescript
// Di domain cash-bank, hilangkan comingSoon:
{
  id: 'cash-bank',
  label: 'Kas & Bank',
  categoryPath: 'cash-bank',
  reports: [
    { id: 'account-statement', title: 'Mutasi Rekening', description: 'Laporan mutasi per rekening kas/bank', path: '/reports/account-statement' },
  ],
},
```

---

## Phase 4 — Halaman Baru: AR/AP Unpaid (Backend Bisa Diakses)

### 4A. BUAT `src/modules/reports/pages/ArUnpaidInvoicesPage.tsx`

Query dari `GET /sales/invoices?status=unpaid` atau endpoint AR.

**Struktur:**
- Filter tanggal + pelanggan (pakai `ReportFilterParameter`)
- DataTable daftar faktur belum lunas
- Summary cards: total outstanding, jumlah faktur, rata-rata umur

### 4B. BUAT `src/modules/reports/pages/ApUnpaidBillsPage.tsx`

Query dari `GET /purchase/bills?status=unpaid` atau endpoint AP.

**Struktur:**
- Filter tanggal + pemasok (pakai `ReportFilterParameter`)
- DataTable daftar tagihan belum lunas
- Summary cards: total outstanding, jumlah tagihan

### 4C. Update routes & categories

Tambahkan route di `routes.tsx` (sebelum `:categoryPath`) dan update `reportCategories.ts` (hilangkan `comingSoon: true`).

---

## Ringkasan Semua File

### File BARU (5 file)

| # | File | Phase | Isi |
|---|---|---|---|
| 1 | `src/modules/reports/constants/reportCategories.ts` | 1 | Data 11 domain + ~45 laporan |
| 2 | `src/modules/reports/components/ReportDomainPanel.tsx` | 1 | Grid card laporan per domain |
| 3 | `src/modules/reports/pages/ReportCategoryPage.tsx` | 1 | Halaman `/reports/:categoryPath` |
| 4 | `src/modules/reports/pages/CashBankStatementPage.tsx` | 3 | Halaman mutasi rekening |
| 5 | `src/modules/reports/pages/ArUnpaidInvoicesPage.tsx` | 4 | Faktur belum lunas (setelah Phase 3) |
| 6 | `src/modules/reports/pages/ApUnpaidBillsPage.tsx` | 4 | Hutang belum lunas (setelah Phase 3) |

### File DIUBAH (4 file)

| # | File | Phase | Perubahan |
|---|---|---|---|
| 1 | `src/modules/reports/pages/ReportIndexPage.tsx` | 1 | Redirect ke `/reports/financial` |
| 2 | `src/modules/reports/routes.tsx` | 1,3,4 | Tambah `ReportCategoryPage`, `CashBankStatementPage`, route AR/AP unpaid |
| 3 | `src/router/moduleConfig.ts` | 2 | Ganti 12 ribbon items → 10 kategori |
| 4 | `src/modules/reports/constants/reportCategories.ts` | 3,4 | Update `comingSoon` → `false` |

### File TIDAK DIUBAH

- Semua halaman laporan existing (`TrialBalancePage.tsx`, `ProfitLossPage.tsx`, dll)
- `src/modules/reports/services/reportsApi.ts` (kecuali tambahan untuk account-statement)
- `src/modules/reports/types/reports.types.ts` (kecuali tambahan types baru)
- `src/components/shared/layout/AppShell.tsx`
- `src/components/shared/layout/RibbonPanel.tsx`
- `src/router/index.tsx`

---

## Urutan Pengerjaan

```
Phase 1 — Navigasi Core
─────────────────────────
 1. ✅ Pastikan Phase 36 SELESAI dan npm run build = 0 error
 2. ✅ BUAT  src/modules/reports/constants/reportCategories.ts
 3. ✅ BUAT  src/modules/reports/components/ReportDomainPanel.tsx
 4. ✅ BUAT  src/modules/reports/pages/ReportCategoryPage.tsx
 5. ✅ UBAH  src/modules/reports/pages/ReportIndexPage.tsx (redirect)
 6. ✅ UBAH  src/modules/reports/routes.tsx (tambah :categoryPath)
 7. ✅ npm run build  ← pastikan 0 error
 8. ✅ Test: buka /reports → redirect ke /reports/financial → lihat domain panel

Phase 2 — Ribbon
─────────────────
 9. ✅ UBAH  src/router/moduleConfig.ts (ganti ribbon items)
10. ✅ npm run build  ← pastikan 0 error
11. ✅ Test: klik ribbon items → buka primary tab → secondary "Daftar" → domain panel
12. ✅ Test: klik card "Neraca Saldo" → buka secondary tab baru → TrialBalancePage muncul

Phase 3 — Quick Win: Kas & Bank
────────────────────────────────
13. ✅ BUAT  src/modules/reports/pages/CashBankStatementPage.tsx
14. ✅ UBAH  src/modules/reports/routes.tsx (tambah route account-statement)
15. ✅ UBAH  src/modules/reports/constants/reportCategories.ts (comingSoon → false)
16. ✅ npm run build  ← pastikan 0 error
17. ✅ Test: /reports/cash-bank → klik Mutasi Rekening → halaman muncul

Phase 4 — AR/AP Unpaid
───────────────────────
18. ✅ BUAT  src/modules/reports/pages/ArUnpaidInvoicesPage.tsx
19. ✅ BUAT  src/modules/reports/pages/ApUnpaidBillsPage.tsx
20. ✅ UBAH  src/modules/reports/routes.tsx (tambah 2 route)
21. ✅ UBAH  src/modules/reports/constants/reportCategories.ts (comingSoon → false)
22. ✅ npm run build  ← pastikan 0 error

Final
─────
23. ✅ npm run lint   ← 0 error
24. ✅ Update docs/struktur_frontend.md (tambah semua file baru)
25. ✅ Update AGENTS.md §6 (update status)
```

---

## Verifikasi Manual Setiap Phase

### Setelah Phase 1-2 (navigasi):

| Test | Langkah | Ekspektasi |
|---|---|---|
| Redirect | Buka `/reports` | Redirect ke `/reports/financial` |
| Domain panel | Buka `/reports/financial` | Tampil 5 card: Neraca Saldo, Laba Rugi, Neraca, Arus Kas, Ringkasan |
| Domain panel | Buka `/reports/gl` | Tampil card: Buku Besar, Neraca Saldo, Buku Besar per Akun |
| Ribbon | Klik "Keuangan" di ribbon | Primary tab "Keuangan" + secondary "Daftar" terbuka |
| Ribbon | Klik "Buku Besar" di ribbon | Primary tab "Buku Besar" terbuka |
| Klik card | Di domain Keuangan, klik "Neraca Saldo" | Secondary tab baru "Neraca Saldo" → TrialBalancePage |
| Switch tab | Klik tab "Daftar" | Kembali ke domain panel Keuangan |
| Klik card | Klik "Arus Kas" | Secondary tab "Arus Kas" → CashFlowPage |
| Domain kosong | Buka `/reports/sales` | Tampil 4 card "Segera" (coming soon) |
| Domain fixed-assets | Buka `/reports/fixed-assets` | 4 card, klik → redirect ke /fixed-assets/reports/register (beda modul) |
| 404 | Buka `/reports/nonexistent` | Domain panel: "Kategori tidak ditemukan" |

### Setelah Phase 3:

| Test | Langkah | Ekspektasi |
|---|---|---|
| Cash bank domain | Buka `/reports/cash-bank` | 1 card: Mutasi Rekening (tidak coming soon) |
| Statement page | Klik "Mutasi Rekening" | Halaman Mutasi Rekening dengan filter + DataTable |

---

## Catatan Penting

1. **Urutan route di `routes.tsx` sangat kritis.** Semua rute spesifik (`/reports/trial-balance`, `/reports/ar-aging`, dll) HARUS di atas `:categoryPath`. Kalau tidak, URL laporan akan ditangkap sebagai category path.

2. **Ribbon items yang diklik membuka tab.** AppShell otomatis mendeteksi path dari ribbon item, membuka primary tab dengan id `reports-{itemId}`, lalu membuka secondary tab "Daftar" untuk path tersebut. Ini behavior existing — tidak perlu diubah.

3. **Halaman laporan spesifik TIDAK punya ribbon item lagi.** Saat user di `/reports/trial-balance`, `findRibbonItemByPath` tidak akan nemu match (karena "trial-balance" bukan category path). AppShell akan skip tab management — halaman tetap render normal. Secondary tab manual dari domain panel akan tetap berfungsi.

4. **Fixed Assets reports cross-module.** Saat user klik card di domain `fixed-assets`, mereka di-navigate ke `/fixed-assets/reports/register`. AppShell akan mendeteksi modul `fixed-assets` (bukan `reports`), dan ribbon akan berubah ke ribbon fixed-assets. Ini behavior yang diinginkan.

5. **Laporan Pajak tidak masuk ribbon.** Kategori "Laporan Pajak" tetap ada di `reportCategories.ts` tapi tidak punya ribbon item (semua laporannya coming soon). Bisa ditambahkan ke ribbon nanti saat backend sudah siap.
