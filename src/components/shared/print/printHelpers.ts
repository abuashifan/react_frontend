import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import type { PrintParty } from './TransactionDocumentPrint'

/** Rp tanpa desimal untuk dokumen cetak. */
export const printMoney = (value: number | string | null | undefined) => formatCurrency(value ?? 0)

/** Qty tanpa nol di belakang koma (5 bukan 5,0000). */
export const printQty = (value: number | string | null | undefined) => {
  const n = Number(value) || 0
  return formatNumber(n, Number.isInteger(n) ? 0 : 2)
}

export const printDate = (value: string | null | undefined) => (value ? formatDate(value) : '-')

function field(source: unknown, key: string): string | null {
  if (typeof source !== 'object' || source === null) return null
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

/**
 * Blok pihak lawan dari objek kontak. Detail dokumen memuat model kontak utuh
 * dari backend (alamat, telepon, NPWP) walau tipe frontendnya hanya id/nama,
 * jadi kolom tambahan dibaca bila ada.
 */
export function contactParty(label: string, contact: unknown, extraLines: Array<string | null | undefined> = []): PrintParty {
  const phone = field(contact, 'phone')
  const npwp = field(contact, 'tax_number')
  return {
    label,
    name: field(contact, 'name'),
    lines: [...extraLines, field(contact, 'address'), phone ? `Telp. ${phone}` : null, npwp ? `NPWP ${npwp}` : null],
  }
}

/**
 * Jumlah baris sebelum pajak (qty x harga - diskon %). `line_total` backend
 * sudah termasuk pajak, sehingga tidak cocok dengan Subtotal di bawah tabel.
 */
export const lineAmount = (l: { quantity: number; unit_price: number; discount_percent?: number | null }) =>
  printMoney(Number(l.quantity) * Number(l.unit_price) * (1 - Number(l.discount_percent || 0) / 100))

/** Nama produk baris dokumen: nama produk bila ada, deskripsi sebagai keterangan. */
export function lineItem(product: { name?: string | null; code?: string | null } | null | undefined, description: string | null | undefined): string {
  const name = product?.name?.trim()
  const desc = description?.trim()
  if (name && desc && desc !== name) return `${name} — ${desc}`
  return name || desc || '-'
}
