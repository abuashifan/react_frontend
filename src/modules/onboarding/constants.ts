import { Flame, ShoppingCart, Briefcase, Factory, FileText } from 'lucide-react'
import type { FC, SVGProps } from 'react'
type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>

// ─── Account Mapping ──────────────────────────────────────────────────────────

export interface MappingDef {
  key: string
  label: string
  required: boolean
}

export interface MappingSection {
  title: string
  mappings: MappingDef[]
}

export const MAPPING_SECTIONS: MappingSection[] = [
  {
    title: 'Penjualan',
    mappings: [
      { key: 'sales.accounts_receivable', label: 'Akun Piutang Usaha (AR)', required: true },
      { key: 'sales.revenue', label: 'Akun Pendapatan', required: true },
      { key: 'sales.customer_deposit', label: 'Akun Deposit Customer', required: true },
      { key: 'sales.return', label: 'Akun Retur Penjualan', required: false },
      { key: 'sales.tax_output', label: 'Akun Pajak Keluaran', required: false },
    ],
  },
  {
    title: 'Pembelian',
    mappings: [
      { key: 'purchase.accounts_payable', label: 'Akun Hutang Usaha (AP)', required: true },
      { key: 'purchase.expense', label: 'Akun Beban Pembelian', required: true },
      { key: 'purchase.vendor_deposit', label: 'Akun Deposit Vendor', required: true },
      { key: 'purchase.return', label: 'Akun Retur Pembelian', required: false },
      { key: 'purchase.tax_input', label: 'Akun Pajak Masukan', required: false },
      { key: 'purchase.inventory_interim', label: 'Akun Persediaan Interim', required: false },
    ],
  },
  {
    title: 'Persediaan',
    mappings: [
      { key: 'inventory.asset', label: 'Akun Aset Persediaan', required: true },
      { key: 'inventory.cogs', label: 'Akun HPP', required: true },
      { key: 'inventory.adjustment_gain', label: 'Akun Selisih Lebih Opname', required: false },
      { key: 'inventory.adjustment_loss', label: 'Akun Selisih Kurang Opname', required: false },
    ],
  },
  {
    title: 'Kas & Bank',
    mappings: [
      { key: 'cash_bank.default_cash', label: 'Akun Kas Default', required: true },
      { key: 'cash_bank.default_bank', label: 'Akun Bank Default', required: true },
    ],
  },
  {
    title: 'Pembukaan & Penutupan',
    mappings: [
      { key: 'opening_balance.equity', label: 'Akun Ekuitas Opening', required: true },
      { key: 'closing.retained_earnings', label: 'Akun Laba Ditahan', required: true },
      { key: 'closing.current_year_earnings', label: 'Akun Laba Tahun Berjalan', required: true },
    ],
  },
]

// ─── COA Templates ────────────────────────────────────────────────────────────

export interface CoaTemplate {
  id: string
  label: string
  description: string
  Icon: LucideIcon
  accountCount: number
}

export const COA_TEMPLATES: CoaTemplate[] = [
  { id: 'gas_agent', label: 'Agen Gas', description: 'COA standar untuk bisnis distribusi gas LPG', Icon: Flame, accountCount: 45 },
  { id: 'trading', label: 'Perdagangan Umum', description: 'COA standar untuk bisnis dagang barang', Icon: ShoppingCart, accountCount: 52 },
  { id: 'service', label: 'Jasa', description: 'COA standar untuk bisnis jasa dan konsultan', Icon: Briefcase, accountCount: 38 },
  { id: 'manufacture', label: 'Manufaktur', description: 'COA standar untuk bisnis produksi', Icon: Factory, accountCount: 68 },
  { id: 'blank', label: 'Kosong', description: 'Mulai dari nol, buat COA sendiri', Icon: FileText, accountCount: 0 },
]
