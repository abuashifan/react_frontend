import type { LucideIcon } from 'lucide-react'
import {
  FileQuestion, ShoppingCart, Truck, FileOutput, Receipt,
  Banknote, RotateCcw, BookOpen, ClipboardList, Package, PackageCheck,
  FileText, CreditCard, BarChart3, ArrowLeftRight, SlidersHorizontal,
  ClipboardCheck, Calendar, CalendarDays, TrendingUp, TrendingDown,
  CheckSquare, BookMarked, Scale, LayoutGrid, Droplets, Clock,
  Landmark, Users, Ruler, Warehouse, CalendarClock, Building2,
  FolderKanban, Map, Building, RefreshCcw, UserCog, ShieldCheck, Star,
  Mail, Shield, Archive,
} from 'lucide-react'

export interface RibbonItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
  permission?: string
}

export interface ModuleConfig {
  id: string
  label: string
  path: string
  permission?: string
  ribbonItems: RibbonItem[]
}

export const MODULE_CONFIGS: ModuleConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    ribbonItems: [],
  },
  {
    id: 'master-data',
    label: 'Master Data',
    path: '/master-data',
    ribbonItems: [
      { id: 'chart-of-accounts', label: 'Akun (COA)', icon: Landmark, path: '/master-data/coa', permission: 'master-data.view' },
      { id: 'contacts', label: 'Kontak', icon: Users, path: '/master-data/contacts', permission: 'master-data.view' },
      { id: 'products', label: 'Produk', icon: Package, path: '/master-data/products', permission: 'master-data.view' },
      { id: 'units', label: 'Satuan', icon: Ruler, path: '/master-data/units', permission: 'master-data.view' },
      { id: 'warehouses', label: 'Gudang', icon: Warehouse, path: '/master-data/warehouses', permission: 'master-data.view' },
      { id: 'payment-terms', label: 'Syarat Bayar', icon: CalendarClock, path: '/master-data/payment-terms', permission: 'master-data.view' },
      { id: 'departments', label: 'Departemen', icon: Building2, path: '/master-data/departments', permission: 'master-data.view' },
      { id: 'projects', label: 'Proyek', icon: FolderKanban, path: '/master-data/projects', permission: 'master-data.view' },
      { id: 'account-mappings', label: 'Pemetaan Akun', icon: Map, path: '/master-data/account-mappings', permission: 'master-data.view' },
    ],
  },
  {
    id: 'accounting',
    label: 'Buku Besar',
    path: '/accounting',
    ribbonItems: [
      { id: 'journals', label: 'Jurnal Umum', icon: BookOpen, path: '/accounting/journals', permission: 'journal.view' },
      { id: 'opening-balance', label: 'Saldo Awal', icon: Archive, path: '/opening-balance', permission: 'opening_balance.view' },
      { id: 'period-locks', label: 'Periode Akuntansi', icon: Calendar, path: '/accounting/period-locks', permission: 'accounting.period-locks.manage' },
      { id: 'period-end', label: 'Akhir Periode', icon: CheckSquare, path: '/accounting/period-end', permission: 'period_end.view' },
      { id: 'fiscal-years', label: 'Tahun Fiskal', icon: CalendarDays, path: '/accounting/fiscal-years', permission: 'accounting.fiscal-years.manage' },
    ],
  },
  {
    id: 'cash-bank',
    label: 'Kas & Bank',
    path: '/cash-bank',
    ribbonItems: [
      { id: 'cash-receipts', label: 'Penerimaan Kas', icon: TrendingUp, path: '/cash-bank/cash-receipts', permission: 'cash_bank.view' },
      { id: 'cash-payments', label: 'Pengeluaran Kas', icon: TrendingDown, path: '/cash-bank/cash-payments', permission: 'cash_bank.view' },
      { id: 'transfers', label: 'Transfer', icon: ArrowLeftRight, path: '/cash-bank/bank-transfers', permission: 'cash_bank.view' },
      { id: 'reconciliations', label: 'Rekonsiliasi', icon: CheckSquare, path: '/cash-bank/bank-reconciliations', permission: 'cash_bank.view' },
    ],
  },
  {
    id: 'sales',
    label: 'Penjualan',
    path: '/sales',
    ribbonItems: [
      { id: 'quotations', label: 'Penawaran', icon: FileQuestion, path: '/sales/quotations', permission: 'sales.quotations.view' },
      { id: 'orders', label: 'Sales Order', icon: ShoppingCart, path: '/sales/orders', permission: 'sales.orders.view' },
      { id: 'delivery-orders', label: 'Pengiriman', icon: Truck, path: '/sales/delivery-orders', permission: 'sales.delivery-orders.view' },
      { id: 'proformas', label: 'Proforma', icon: FileOutput, path: '/sales/proformas', permission: 'sales.proformas.view' },
      { id: 'invoices', label: 'Invoice', icon: Receipt, path: '/sales/invoices', permission: 'sales.invoices.view' },
      { id: 'receipts', label: 'Penerimaan', icon: Banknote, path: '/sales/receipts', permission: 'sales.receipts.view' },
      { id: 'returns', label: 'Retur', icon: RotateCcw, path: '/sales/returns', permission: 'sales.returns.view' },
      { id: 'ar', label: 'Piutang', icon: BookOpen, path: '/sales/ar', permission: 'sales.ar.view' },
    ],
  },
  {
    id: 'purchase',
    label: 'Pembelian',
    path: '/purchase',
    ribbonItems: [
      { id: 'requests', label: 'Permintaan', icon: ClipboardList, path: '/purchase/requests', permission: 'purchase.requests.view' },
      { id: 'orders', label: 'Purchase Order', icon: Package, path: '/purchase/orders', permission: 'purchase.orders.view' },
      { id: 'goods-receipts', label: 'Penerimaan Brg', icon: PackageCheck, path: '/purchase/goods-receipts', permission: 'purchase.goods-receipts.view' },
      { id: 'bills', label: 'Tagihan', icon: FileText, path: '/purchase/bills', permission: 'purchase.bills.view' },
      { id: 'payments', label: 'Pembayaran', icon: CreditCard, path: '/purchase/payments', permission: 'purchase.payments.view' },
      { id: 'returns', label: 'Retur', icon: RotateCcw, path: '/purchase/returns', permission: 'purchase.returns.view' },
      { id: 'ap', label: 'Hutang', icon: BookOpen, path: '/purchase/ap', permission: 'purchase.ap.view' },
    ],
  },
  {
    id: 'inventory',
    label: 'Persediaan',
    path: '/inventory',
    ribbonItems: [
      { id: 'stock-balances', label: 'Saldo Stok', icon: BarChart3, path: '/inventory/stock-balances', permission: 'inventory.stock.view' },
      { id: 'movements', label: 'Mutasi Stok', icon: ArrowLeftRight, path: '/inventory/movements', permission: 'inventory.movements.view' },
      { id: 'adjustments', label: 'Penyesuaian', icon: SlidersHorizontal, path: '/inventory/adjustments', permission: 'inventory.adjustments.view' },
      { id: 'opnames', label: 'Opname', icon: ClipboardCheck, path: '/inventory/opnames', permission: 'inventory.opnames.view' },
    ],
  },
  {
    id: 'fixed-assets',
    label: 'Aktiva Tetap',
    path: '/fixed-assets',
    ribbonItems: [
      { id: 'assets', label: 'Daftar Aktiva', icon: Building2, path: '/fixed-assets', permission: 'fixed_assets.view' },
      { id: 'categories', label: 'Kategori', icon: Archive, path: '/fixed-assets/categories', permission: 'fixed_assets.settings.view' },
      { id: 'register-report', label: 'Register', icon: FileText, path: '/fixed-assets/reports/register', permission: 'fixed_assets.reports.view' },
      { id: 'depreciation-report', label: 'Depresiasi', icon: TrendingDown, path: '/fixed-assets/reports/depreciation', permission: 'fixed_assets.reports.view' },
      { id: 'disposals-report', label: 'Disposal', icon: RotateCcw, path: '/fixed-assets/reports/disposals', permission: 'fixed_assets.reports.view' },
      { id: 'reconciliation-report', label: 'Rekonsiliasi', icon: CheckSquare, path: '/fixed-assets/reports/reconciliation', permission: 'fixed_assets.reports.view' },
    ],
  },
  {
    id: 'reports',
    label: 'Daftar Laporan',
    path: '/reports',
    ribbonItems: [
      { id: 'general-ledger', label: 'Buku Besar', icon: BookMarked, path: '/reports/general-ledger', permission: 'reports.view' },
      { id: 'trial-balance', label: 'Trial Balance', icon: Scale, path: '/reports/trial-balance', permission: 'reports.view' },
      { id: 'profit-loss', label: 'Laba Rugi', icon: TrendingUp, path: '/reports/profit-loss', permission: 'reports.view' },
      { id: 'balance-sheet', label: 'Neraca', icon: LayoutGrid, path: '/reports/balance-sheet', permission: 'reports.view' },
      { id: 'cash-flow', label: 'Arus Kas', icon: Droplets, path: '/reports/cash-flow', permission: 'reports.view' },
      { id: 'ar-aging', label: 'AR Aging', icon: Clock, path: '/reports/ar-aging', permission: 'reports.view' },
      { id: 'ap-aging', label: 'AP Aging', icon: Clock, path: '/reports/ap-aging', permission: 'reports.view' },
    ],
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    path: '/settings',
    ribbonItems: [
      { id: 'company', label: 'Perusahaan', icon: Building, path: '/settings/company', permission: 'settings.company.view' },
      { id: 'transactions', label: 'Transaksi', icon: RefreshCcw, path: '/settings/transactions', permission: 'settings.company.view' },
      { id: 'account-mapping', label: 'Pemetaan Akun', icon: Map, path: '/settings/account-mapping', permission: 'settings.company.view' },
      { id: 'accounting-period', label: 'Periode Akuntansi', icon: CalendarDays, path: '/settings/accounting-period', permission: 'settings.company.view' },
      { id: 'users', label: 'Pengguna', icon: UserCog, path: '/settings/users', permission: 'access.users.view' },
      { id: 'roles', label: 'Peran', icon: ShieldCheck, path: '/settings/roles', permission: 'access.roles.view' },
      { id: 'invitations', label: 'Undangan', icon: Mail, path: '/settings/invitations', permission: 'access.invitations.view' },
      { id: 'access-audit', label: 'Audit Akses', icon: Shield, path: '/settings/audit', permission: 'access.audit.view' },
      { id: 'preferences', label: 'Preferensi Saya', icon: Star, path: '/settings/preferences' },
    ],
  },
]

export const MODULE_MAP = Object.fromEntries(MODULE_CONFIGS.map((m) => [m.id, m]))

export const TOP_MODULES: ModuleConfig[] = MODULE_CONFIGS.filter((module) => module.id !== 'dashboard')

/** Detect active module from pathname */
export function detectModuleFromPath(pathname: string): string | null {
  if (pathname === '/') return null
  const match = MODULE_CONFIGS.find(
    (m) => m.id !== 'dashboard' && pathname.startsWith(`/${m.id}`),
  )
  return match?.id ?? null
}

export function findRibbonItemByPath(pathname: string): { module: ModuleConfig; item: RibbonItem } | null {
  const matches = MODULE_CONFIGS
    .filter((module) => module.id !== 'dashboard')
    .flatMap((module) =>
      module.ribbonItems
        .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
        .map((item) => ({ module, item })),
    )
    .sort((a, b) => b.item.path.length - a.item.path.length)

  return matches[0] ?? null
}
