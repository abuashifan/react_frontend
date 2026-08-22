import type { MultiSelectModalGroup } from '@/components/shared/filter/MultiSelectModalFilter'

/**
 * Jenis jurnal = nilai `source_type` pada `journal_entries`, yaitu dokumen yang
 * melahirkan jurnal tersebut.
 *
 * Daftar Jurnal Umum memuat jurnal dari SELURUH modul — manual maupun yang
 * digenerate dokumen transaksi — sehingga penyaringan per modul saja tidak
 * cukup: user perlu mempersempit sampai satu jenis, mis. hanya jurnal
 * depresiasi aset tetap. Karena itu opsi di sini memakai `source_type`
 * (granular), bukan `source_module` seperti filter Sumber di Laporan Jurnal
 * yang hanya mengenal sales/purchase/inventory/general.
 *
 * Nilainya wajib sama persis dengan yang ditulis backend saat membuat jurnal —
 * lihat service tiap modul, mis. `SalesInvoiceService::createJournal()` dan
 * `FixedAssetService::journal()`.
 */
export type JournalSourceType =
  | 'manual_journal'
  | 'sales_invoice'
  | 'sales_receipt'
  | 'sales_return'
  | 'customer_deposit'
  | 'customer_deposit_allocation'
  | 'vendor_bill'
  | 'vendor_payment'
  | 'purchase_return'
  | 'vendor_deposit'
  | 'vendor_deposit_allocation'
  | 'cash_receipt'
  | 'cash_payment'
  | 'bank_transfer'
  | 'stock_movement'
  | 'fixed_asset_capitalization'
  | 'fixed_asset_depreciation'
  | 'fixed_asset_disposal'
  | 'period_end'
  | 'opening_balance'
  | 'opening_fixed_assets'

/**
 * Dikelompokkan per modul asal supaya mudah dipindai di modal filter.
 *
 * Persediaan sengaja hanya punya satu opsi: seluruh jurnal persediaan —
 * penerimaan barang, HPP penjualan, penyesuaian, opname — ditulis dengan
 * `source_type = 'stock_movement'`; pemecahannya ada di tabel
 * `stock_movements`, bukan di `journal_entries`.
 */
export const JOURNAL_SOURCE_TYPE_GROUPS: MultiSelectModalGroup<JournalSourceType>[] = [
  {
    label: 'Umum',
    options: [{ value: 'manual_journal', label: 'Jurnal Manual' }],
  },
  {
    label: 'Penjualan',
    options: [
      { value: 'sales_invoice', label: 'Faktur Penjualan' },
      { value: 'sales_receipt', label: 'Penerimaan Penjualan' },
      { value: 'sales_return', label: 'Retur Penjualan' },
      { value: 'customer_deposit', label: 'Uang Muka Pelanggan' },
      { value: 'customer_deposit_allocation', label: 'Alokasi Uang Muka Pelanggan' },
    ],
  },
  {
    label: 'Pembelian',
    options: [
      { value: 'vendor_bill', label: 'Tagihan Pemasok' },
      { value: 'vendor_payment', label: 'Pembayaran Pemasok' },
      { value: 'purchase_return', label: 'Retur Pembelian' },
      { value: 'vendor_deposit', label: 'Uang Muka Pemasok' },
      { value: 'vendor_deposit_allocation', label: 'Alokasi Uang Muka Pemasok' },
    ],
  },
  {
    label: 'Kas & Bank',
    options: [
      { value: 'cash_receipt', label: 'Penerimaan Kas/Bank' },
      { value: 'cash_payment', label: 'Pembayaran Kas/Bank' },
      { value: 'bank_transfer', label: 'Transfer Bank' },
    ],
  },
  {
    label: 'Persediaan',
    options: [{ value: 'stock_movement', label: 'Mutasi Persediaan' }],
  },
  {
    label: 'Aset Tetap',
    options: [
      { value: 'fixed_asset_capitalization', label: 'Kapitalisasi Aset Tetap' },
      { value: 'fixed_asset_depreciation', label: 'Depresiasi Aset Tetap' },
      { value: 'fixed_asset_disposal', label: 'Pelepasan Aset Tetap' },
    ],
  },
  {
    label: 'Periode & Saldo Awal',
    options: [
      { value: 'period_end', label: 'Tutup Periode' },
      { value: 'opening_balance', label: 'Saldo Awal' },
      { value: 'opening_fixed_assets', label: 'Saldo Awal Aset Tetap' },
    ],
  },
]
