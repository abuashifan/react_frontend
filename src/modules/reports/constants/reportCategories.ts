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
      { id: 'cash-flow-direct', title: 'Arus Kas (Langsung)', description: 'Penerimaan & pembayaran kas aktual dirinci per akun lawan', path: '/reports/cash-flow-direct' },
      { id: 'retained-earnings', title: 'Laba Ditahan', description: 'Laba ditahan awal + laba/rugi berjalan = laba ditahan akhir', path: '/reports/retained-earnings' },
      { id: 'equity-changes', title: 'Perubahan Ekuitas', description: 'Saldo awal, pergerakan, dan saldo akhir per komponen ekuitas', path: '/reports/equity-changes' },
      { id: 'financial-summary', title: 'Ringkasan Keuangan', description: 'Indikator keuangan utama sekilas', path: '/reports/financial-summary' },
    ],
  },
  {
    id: 'gl',
    label: 'Buku Besar',
    categoryPath: 'gl',
    reports: [
      { id: 'general-ledger', title: 'Buku Besar', description: 'Riwayat transaksi per akun dengan saldo berjalan', path: '/reports/general-ledger' },
      { id: 'general-ledger-detail', title: 'Buku Besar - Rincian', description: 'Baris jurnal per akun untuk semua akun sekaligus', path: '/reports/general-ledger?mode=detail' },
      { id: 'trial-balance', title: 'Neraca Saldo', description: 'Saldo debit & kredit semua akun per periode', path: '/reports/trial-balance' },
      { id: 'account-ledger', title: 'Buku Besar per Akun', description: 'Detail mutasi per akun COA', path: '/reports/account-ledger' },
      { id: 'all-journals', title: 'Semua Jurnal', description: 'Daftar semua jurnal per periode dengan total debit & kredit', path: '/reports/journals' },
      { id: 'journals-sales', title: 'Jurnal Penjualan', description: 'Jurnal bersumber transaksi penjualan', path: '/reports/journals?source=sales' },
      { id: 'journals-purchase', title: 'Jurnal Pembelian', description: 'Jurnal bersumber transaksi pembelian', path: '/reports/journals?source=purchase' },
      { id: 'journals-general', title: 'Jurnal Umum', description: 'Jurnal manual (penyesuaian)', path: '/reports/journals?source=general' },
    ],
  },
  {
    id: 'sales',
    label: 'Penjualan',
    categoryPath: 'sales',
    reports: [
      { id: 'sales-summary', title: 'Ringkasan Penjualan', description: 'Rekap total faktur & omset per periode (agregasi)', path: '/reports/sales/summary' },
      { id: 'sales-by-customer', title: 'Penjualan per Pelanggan', description: 'Omset per pelanggan urut terbesar', path: '/reports/sales/by-customer' },
      { id: 'sales-by-product', title: 'Penjualan per Barang', description: 'Kuantitas & omset per produk', path: '/reports/sales/by-product' },
    ],
  },
  {
    id: 'purchase',
    label: 'Pembelian',
    categoryPath: 'purchase',
    reports: [
      { id: 'purchase-summary', title: 'Ringkasan Pembelian', description: 'Rekap total tagihan & belanja per periode (agregasi)', path: '/reports/purchase/summary' },
      { id: 'purchase-by-vendor', title: 'Pembelian per Supplier', description: 'Belanja per supplier urut terbesar', path: '/reports/purchase/by-vendor' },
      { id: 'purchase-by-product', title: 'Pembelian per Barang', description: 'Kuantitas & belanja per produk', path: '/reports/purchase/by-product' },
    ],
  },
  {
    id: 'ar',
    label: 'Piutang',
    categoryPath: 'ar',
    reports: [
      { id: 'ar-aging', title: 'AR Aging', description: 'Analisis umur piutang per pelanggan', path: '/reports/ar-aging' },
      { id: 'ar-outstanding', title: 'Faktur Belum Lunas', description: 'Daftar faktur penjualan yang belum terbayar', path: '/reports/ar-outstanding' },
      { id: 'ar-customer-summary', title: 'Ringkasan Pelanggan', description: 'Saldo piutang dan net exposure per pelanggan', path: '/reports/ar-customer-summary' },
    ],
  },
  {
    id: 'ap',
    label: 'Hutang',
    categoryPath: 'ap',
    reports: [
      { id: 'ap-aging', title: 'AP Aging', description: 'Analisis umur hutang per supplier', path: '/reports/ap-aging' },
      { id: 'ap-outstanding', title: 'Hutang Belum Lunas', description: 'Daftar tagihan supplier yang belum terbayar', path: '/reports/ap-outstanding' },
      { id: 'ap-vendor-summary', title: 'Ringkasan Supplier', description: 'Saldo hutang dan net exposure per supplier', path: '/reports/ap-vendor-summary' },
    ],
  },
  {
    id: 'reconciliation',
    label: 'Rekonsiliasi',
    categoryPath: 'reconciliation',
    reports: [
      { id: 'reconciliation-all', title: 'Rekonsiliasi', description: 'AR · AP · Persediaan · GRNI · Deposit', path: '/reports/reconciliation' },
    ],
  },
  {
    id: 'inventory',
    label: 'Persediaan',
    categoryPath: 'inventory',
    reports: [
      { id: 'stock', title: 'Laporan Stok', description: 'Saldo, mutasi, dan kartu stok per produk', path: '/reports/stock' },
      { id: 'inventory-analysis', title: 'Analisis Inventori', description: 'Valuasi, stok rendah, dan stok negatif', path: '/reports/inventory-analysis' },
      { id: 'inventory-aging', title: 'Umur Persediaan', description: 'Umur stok per produk & gudang dalam bucket 0-30/31-60/61-90/>90 hari', path: '/reports/inventory-aging' },
      { id: 'inventory-journal', title: 'Jurnal Persediaan', description: 'Jurnal bersumber pergerakan stok', path: '/reports/journals?source=inventory' },
      { id: 'inventory-opname', title: 'Kertas Kerja Opname', description: 'Qty sistem vs fisik vs selisih per sesi opname', path: '/reports/inventory-opname' },
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
