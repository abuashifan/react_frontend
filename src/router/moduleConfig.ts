import type { FC, SVGProps } from 'react'
type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>
import {
  FileQuestion, ShoppingCart, Truck, FileOutput, Receipt,
  Banknote, RotateCcw, BookOpen, ClipboardList, Package, PackageCheck,
  FileText, CreditCard, BarChart3, ArrowLeftRight, SlidersHorizontal,
  ClipboardCheck, Calendar, CalendarDays, TrendingUp, TrendingDown,
  CheckSquare,
  Landmark, Users, Ruler, Warehouse, CalendarClock, Building2,
  FolderKanban, Map, Building, RefreshCcw, UserCog, ShieldCheck, Star,
  Mail, Shield, Archive, Tags, CalendarRange, GitCompare, Upload,
  Wallet, LayoutDashboard, FilePlus,
} from 'lucide-react'

export interface RibbonItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
  permission?: string
  /**
   * Pengelompokan visual di dalam ribbon. **Opsional** — modul yang tidak
   * mengisinya tetap dirender datar seperti sebelumnya, jadi menambahkan field
   * ini tidak menyentuh sembilan modul lain.
   *
   * Ribbon adalah strip horizontal setinggi 64px, bukan menu bertingkat: grup
   * ditandai garis pemisah antar kelompok, bukan submenu. Nama grupnya sendiri
   * hidup di breadcrumb halaman dan di katalog Laporan.
   */
  group?: string
}

export interface ModuleConfig {
  id: string
  label: string
  path: string
  permission?: string
  ribbonItems: RibbonItem[]
  /**
   * Klik main menu langsung membuka tab primer halaman daftar modul ini, tanpa
   * ribbon. Dipakai modul yang ribbon-nya hanya jadi pemilih kategori.
   */
  opensListDirectly?: boolean
  /**
   * Konten menempel langsung di bawah baris tab, tanpa jarak kanvas. Dipakai
   * modul yang punya toolbar sendiri di bawah tab (mis. filter bar Laporan)
   * sehingga toolbar terlihat menyatu dengan tab.
   */
  flushContent?: boolean
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
      // Halaman & route-nya sudah lama ada, tapi entri menunya tidak pernah
      // dibuat — jadi hanya terjangkau lewat URL langsung. Delapan master data
      // lain punya entri; ini kelupaan, bukan kesengajaan.
      { id: 'product-categories', label: 'Kategori Produk', icon: Tags, path: '/master-data/product-categories', permission: 'master-data.view' },
      { id: 'units', label: 'Satuan', icon: Ruler, path: '/master-data/units', permission: 'master-data.view' },
      { id: 'warehouses', label: 'Gudang', icon: Warehouse, path: '/master-data/warehouses', permission: 'master-data.view' },
      { id: 'payment-terms', label: 'Syarat Bayar', icon: CalendarClock, path: '/master-data/payment-terms', permission: 'master-data.view' },
      { id: 'departments', label: 'Departemen', icon: Building2, path: '/master-data/departments', permission: 'master-data.view' },
      { id: 'projects', label: 'Proyek', icon: FolderKanban, path: '/master-data/projects', permission: 'master-data.view' },
      { id: 'import', label: 'Impor Data', icon: Upload, path: '/master-data/import', permission: 'imports.view' },
    ],
  },
  {
    id: 'accounting',
    label: 'Buku Besar',
    path: '/accounting',
    ribbonItems: [
      { id: 'journals', label: 'Jurnal Umum', icon: BookOpen, path: '/accounting/journals', permission: 'journal.view' },
      // Saldo awal hanya boleh ada satu batch per perusahaan seumur hidupnya
      // (OPENING_BALANCE_ACTIVE_BATCH_EXISTS di backend), tapi item ini TIDAK
      // boleh disembunyikan setelah setup selesai: Step 5 wizard mengizinkan
      // user melewati saldo awal dengan janji "akan diisi nanti", dan satu-
      // satunya jalan mengisinya adalah halaman ini. Menyembunyikannya membuat
      // janji itu tidak bisa ditepati -- rutenya hidup tapi tak terjangkau
      // menu mana pun. Halaman tujuannya sendiri sudah menangani semua
      // keadaan (belum ada batch → tombol mulai; sudah diposting/dikunci →
      // "Lihat Detail"), jadi aman tampil permanen.
      { id: 'opening-balance', label: 'Saldo Awal', icon: Archive, path: '/opening-balance', permission: 'opening_balance.view' },
      { id: 'period-locks', label: 'Periode Akuntansi', icon: Calendar, path: '/accounting/period-locks', permission: 'accounting.period-locks.manage' },
      { id: 'period-end', label: 'Akhir Periode', icon: CheckSquare, path: '/accounting/period-end', permission: 'period_end.view' },
      { id: 'fiscal-years', label: 'Tahun Fiskal', icon: CalendarDays, path: '/accounting/fiscal-years', permission: 'accounting.fiscal-years.manage' },
    ],
  },
  {
    // Id `budget` bukan pilihan bebas: detectModuleFromPath() mencocokkan
    // pathname.startsWith('/' + module.id), jadi id ini langsung cocok dengan
    // rute /budget/... yang sudah ada tanpa memindahkan satu rute pun.
    id: 'budget',
    label: 'Anggaran',
    path: '/budget',
    ribbonItems: [
      { id: 'budget-dashboard', group: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/budget/dashboard', permission: 'budgets.view' },

      // Urutan mengikuti alur proses: pagu top-down (Tahap 1-2) dulu, baru
      // pengajuan RAB bottom-up (Tahap 4) — bukan urutan CRUD submission yang
      // jadi objek utama modul ini secara teknis.
      { id: 'budget-periods', group: 'Budget', label: 'Pagu Anggaran', icon: CalendarRange, path: '/budget/periods', permission: 'budgets.view' },
      { id: 'budget-list', group: 'Budget', label: 'Daftar Budget', icon: ClipboardList, path: '/budget/submissions', permission: 'budgets.view' },
      { id: 'budget-create', group: 'Budget', label: 'Buat Budget', icon: FilePlus, path: '/budget/submissions/new', permission: 'budgets.submit' },

      // Empat entri Monitoring adalah preset dari SATU halaman analisis, bukan
      // empat halaman. Yang berbeda hanya `group_by` dan `mode` awalnya.
      { id: 'budget-vs-actual', group: 'Monitoring', label: 'Budget vs Actual', icon: GitCompare, path: '/budget/analysis?preset=vs-actual', permission: 'budgets.view' },
      { id: 'budget-variance', group: 'Monitoring', label: 'Variance', icon: TrendingDown, path: '/budget/analysis?preset=variance', permission: 'budgets.view' },
      { id: 'budget-utilization', group: 'Monitoring', label: 'Utilization', icon: BarChart3, path: '/budget/analysis?preset=utilization', permission: 'budgets.view' },
      { id: 'budget-summary', group: 'Monitoring', label: 'Summary', icon: LayoutDashboard, path: '/budget/analysis?preset=summary', permission: 'budgets.view' },

      // Lima entri Project juga satu halaman, bertab.
      { id: 'budget-project-budget', group: 'Project', label: 'Project Budget', icon: FolderKanban, path: '/budget/projects?tab=budget', permission: 'budgets.view' },
      { id: 'budget-project-actual', group: 'Project', label: 'Project Actual', icon: Receipt, path: '/budget/projects?tab=actual', permission: 'budgets.view' },
      { id: 'budget-project-profit', group: 'Project', label: 'Project Profitability', icon: TrendingUp, path: '/budget/projects?tab=profitability', permission: 'budgets.view' },
      { id: 'budget-project-cash', group: 'Project', label: 'Project Cash Flow', icon: Banknote, path: '/budget/projects?tab=cash-flow', permission: 'budgets.view' },
      { id: 'budget-project-tx', group: 'Project', label: 'Project Transactions', icon: BookOpen, path: '/budget/projects?tab=transactions', permission: 'budgets.view' },

      { id: 'budget-cash', group: 'Cash', label: 'Cash Budget', icon: Wallet, path: '/budget/cash', permission: 'budgets.view' },
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
      // Tidak ada item "Piutang" di sini — laporan piutang tinggal di menu
      // Laporan (kategori Piutang: AR Aging, Faktur Belum Lunas, Ringkasan
      // Pelanggan, dan Rekonsiliasi). Item ribbon lama menunjuk `/sales/ar`
      // yang cuma <Navigate> telanjang di luar ProtectedRoute, jadi selain
      // duplikat ia juga membuat AppShell unmount lalu mount berulang.
      // Route /sales/ar/* sendiri dibiarkan hidup: masih dipakai drill-down
      // dan URL langsung.
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
      // Tidak ada item "Hutang" di sini — alasannya sama dengan Piutang di modul
      // Penjualan; laporannya ada di menu Laporan kategori Hutang.
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
    // Ribbon Laporan dinonaktifkan — kategori kini jadi sidebar di ReportListPage.
    // Model lamanya diarsipkan di src/router/legacy/reportsRibbon.legacy.ts.
    ribbonItems: [],
    opensListDirectly: true,
    flushContent: true,
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
