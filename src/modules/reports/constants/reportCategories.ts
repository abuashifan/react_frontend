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
  categoryPath: string
  reports: ReportEntry[]
}

export const REPORT_DOMAINS: ReportDomain[] = [
  {
    id: 'financial',
    label: 'Keuangan',
    categoryPath: 'financial',
    reports: [
      { id: 'balance-sheet', title: 'Neraca', description: 'Aset, kewajiban, dan ekuitas per tanggal', path: '/reports/balance-sheet' },
      { id: 'profit-loss', title: 'Laba Rugi', description: 'Pendapatan, beban, dan laba bersih per periode', path: '/reports/profit-loss' },
      { id: 'cash-flow', title: 'Arus Kas', description: 'Arus masuk dan keluar kas per periode', path: '/reports/cash-flow' },
      { id: 'financial-summary', title: 'Ringkasan Keuangan', description: 'Indikator keuangan utama sekilas', path: '/reports/financial-summary' },
    ],
  },
  {
    id: 'gl',
    label: 'Buku Besar',
    categoryPath: 'gl',
    reports: [
      { id: 'general-ledger', title: 'Buku Besar', description: 'Riwayat transaksi per akun dengan saldo berjalan', path: '/reports/general-ledger' },
      { id: 'trial-balance', title: 'Neraca Saldo', description: 'Saldo debit & kredit semua akun per periode', path: '/reports/trial-balance' },
      { id: 'account-ledger', title: 'Buku Besar per Akun', description: 'Detail mutasi per akun COA', path: '/reports/account-ledger' },
    ],
  },
  {
    id: 'sales',
    label: 'Penjualan',
    categoryPath: 'sales',
    reports: [
      { id: 'sales-summary', title: 'Ringkasan Penjualan', description: 'Rekap penjualan per periode', path: '/reports/sales/summary', comingSoon: true },
      { id: 'sales-by-customer', title: 'Penjualan per Pelanggan', description: 'Breakdown penjualan per pelanggan', path: '/reports/sales/by-customer', comingSoon: true },
    ],
  },
  {
    id: 'purchase',
    label: 'Pembelian',
    categoryPath: 'purchase',
    reports: [
      { id: 'purchase-summary', title: 'Ringkasan Pembelian', description: 'Rekap pembelian per periode', path: '/reports/purchase/summary', comingSoon: true },
      { id: 'purchase-by-vendor', title: 'Pembelian per Supplier', description: 'Breakdown pembelian per supplier', path: '/reports/purchase/by-vendor', comingSoon: true },
    ],
  },
  {
    id: 'ar',
    label: 'Piutang',
    categoryPath: 'ar',
    reports: [
      { id: 'ar-aging', title: 'AR Aging', description: 'Analisis umur piutang per pelanggan', path: '/reports/ar-aging' },
    ],
  },
  {
    id: 'ap',
    label: 'Hutang',
    categoryPath: 'ap',
    reports: [
      { id: 'ap-aging', title: 'AP Aging', description: 'Analisis umur hutang per supplier', path: '/reports/ap-aging' },
    ],
  },
  {
    id: 'reconciliation',
    label: 'Rekonsiliasi',
    categoryPath: 'reconciliation',
    reports: [],
  },
  {
    id: 'inventory',
    label: 'Persediaan',
    categoryPath: 'inventory',
    reports: [
      { id: 'stock', title: 'Laporan Stok', description: 'Saldo, mutasi, dan kartu stok per produk', path: '/reports/stock' },
      { id: 'inventory-analysis', title: 'Analisis Inventori', description: 'Valuasi, stok rendah, dan stok negatif', path: '/reports/inventory-analysis' },
    ],
  },
  {
    id: 'fixed-assets',
    label: 'Aktiva Tetap',
    categoryPath: 'fixed-assets',
    reports: [
      { id: 'fa-register', title: 'Daftar Aktiva Tetap', description: 'Register seluruh aktiva tetap per bulan', path: '/reports/fixed-assets/register' },
      { id: 'fa-depreciation', title: 'Laporan Penyusutan', description: 'Penyusutan per periode', path: '/reports/fixed-assets/depreciation' },
      { id: 'fa-disposals', title: 'Laporan Pelepasan', description: 'Aktiva tetap yang dilepas', path: '/reports/fixed-assets/disposals' },
      { id: 'fa-reconciliation', title: 'Rekonsiliasi Aktiva Tetap', description: 'Rekonsiliasi nilai buku vs COA', path: '/reports/fixed-assets/reconciliation' },
    ],
  },
  {
    id: 'cash-bank',
    label: 'Kas & Bank',
    categoryPath: 'cash-bank',
    reports: [
      { id: 'account-statement', title: 'Mutasi Rekening', description: 'Mutasi kas & bank per rekening', path: '/reports/account-statement' },
    ],
  },
]

export const DOMAIN_BY_PATH: Record<string, ReportDomain> = Object.fromEntries(
  REPORT_DOMAINS.map((d) => [d.categoryPath, d]),
)

export const DEFAULT_DOMAIN = 'financial'
