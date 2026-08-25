/**
 * Urutan & judul section modul untuk daftar Account Mapping -- dipakai
 * bersama oleh setup wizard (Step3AccountMapping) dan Pengaturan -> Pemetaan
 * Akun lewat AccountMappingGroupedFields, supaya kedua layar selalu identik.
 */
export const ACCOUNT_MAPPING_MODULE_ORDER = [
  'sales',
  'purchase',
  'inventory',
  'fixed_assets',
  'cash_bank',
  'opening_balance',
  'closing',
  'journal',
] as const

export const ACCOUNT_MAPPING_MODULE_TITLES: Record<string, string> = {
  sales: 'Penjualan',
  purchase: 'Pembelian',
  inventory: 'Persediaan',
  fixed_assets: 'Aset Tetap',
  cash_bank: 'Kas & Bank',
  opening_balance: 'Saldo Awal',
  closing: 'Tutup Buku',
  journal: 'Jurnal',
}
