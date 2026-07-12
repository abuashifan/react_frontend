import type { ReportParams } from '../types/reports.types'

// Peta report_key -> route + label (Fase 13). Selaras dengan whitelist backend
// (SavedReport::ALLOWED_REPORT_KEYS) dan katalog laporan.
export const REPORT_KEY_META: Record<string, { path: string; label: string }> = {
  'general-ledger': { path: '/reports/general-ledger', label: 'Buku Besar' },
  'general-ledger-detail': { path: '/reports/general-ledger?mode=detail', label: 'Buku Besar - Rincian' },
  'trial-balance': { path: '/reports/trial-balance', label: 'Neraca Saldo' },
  'profit-loss': { path: '/reports/profit-loss', label: 'Laba Rugi' },
  'balance-sheet': { path: '/reports/balance-sheet', label: 'Neraca' },
  'cash-flow': { path: '/reports/cash-flow', label: 'Arus Kas' },
  'cash-flow-direct': { path: '/reports/cash-flow-direct', label: 'Arus Kas (Langsung)' },
  'retained-earnings': { path: '/reports/retained-earnings', label: 'Laba Ditahan' },
  'equity-changes': { path: '/reports/equity-changes', label: 'Perubahan Ekuitas' },
  'financial-summary': { path: '/reports/financial-summary', label: 'Ringkasan Keuangan' },
  journals: { path: '/reports/journals', label: 'Semua Jurnal' },
  'account-ledger': { path: '/reports/account-ledger', label: 'Buku Besar per Akun' },
  'account-statement': { path: '/reports/account-statement', label: 'Mutasi Rekening' },
  'ar-aging': { path: '/reports/ar-aging', label: 'AR Aging' },
  'ap-aging': { path: '/reports/ap-aging', label: 'AP Aging' },
  'ar-outstanding': { path: '/reports/ar-outstanding', label: 'Faktur Belum Lunas' },
  'ap-outstanding': { path: '/reports/ap-outstanding', label: 'Hutang Belum Lunas' },
  'ar-customer-summary': { path: '/reports/ar-customer-summary', label: 'Ringkasan Pelanggan' },
  'ap-vendor-summary': { path: '/reports/ap-vendor-summary', label: 'Ringkasan Supplier' },
  stock: { path: '/reports/stock', label: 'Laporan Stok' },
  'inventory-analysis': { path: '/reports/inventory-analysis', label: 'Analisis Inventori' },
  'inventory-aging': { path: '/reports/inventory-aging', label: 'Umur Persediaan' },
  'inventory-opname': { path: '/reports/inventory-opname', label: 'Kertas Kerja Opname' },
  'sales-summary': { path: '/reports/sales/summary', label: 'Ringkasan Penjualan' },
  'sales-by-customer': { path: '/reports/sales/by-customer', label: 'Penjualan per Pelanggan' },
  'sales-by-product': { path: '/reports/sales/by-product', label: 'Penjualan per Barang' },
  'purchase-summary': { path: '/reports/purchase/summary', label: 'Ringkasan Pembelian' },
  'purchase-by-vendor': { path: '/reports/purchase/by-vendor', label: 'Pembelian per Supplier' },
  'purchase-by-product': { path: '/reports/purchase/by-product', label: 'Pembelian per Barang' },
  'output-vat': { path: '/reports/tax/output-vat', label: 'PPN Keluaran' },
  'input-vat': { path: '/reports/tax/input-vat', label: 'PPN Masukan' },
}

export function reportKeyLabel(key: string): string {
  return REPORT_KEY_META[key]?.label ?? key
}

// Bentuk URL untuk membuka saved report dengan params ter-restore lewat query
// string. Halaman yang terintegrasi (Fase 13 T13.4) membaca query ini saat mount.
export function buildSavedReportUrl(reportKey: string, params: ReportParams): string {
  const meta = REPORT_KEY_META[reportKey]
  if (!meta) return '/reports'
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    usp.append(k, String(v))
  })
  const qs = usp.toString()
  if (!qs) return meta.path
  const sep = meta.path.includes('?') ? '&' : '?'
  return `${meta.path}${sep}${qs}`
}
