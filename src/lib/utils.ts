import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Fallback ditampilkan untuk nilai kosong/invalid. `0` tetap dianggap valid. */
export const EMPTY_VALUE = '-'

/**
 * Coerce input angka yang mungkin null/undefined/string/NaN menjadi number valid.
 * Mengembalikan `null` jika tidak bisa direpresentasikan sebagai angka berhingga.
 * Catatan: `0` valid, string kosong / `"abc"` / `NaN` / `Infinity` → null.
 */
function toFiniteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function formatCurrency(amount: number | string | null | undefined, currency = 'IDR'): string {
  const n = toFiniteNumber(amount)
  if (n === null) return EMPTY_VALUE
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(date: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
  if (date === null || date === undefined) return EMPTY_VALUE
  if (typeof date === 'string' && date.trim() === '') return EMPTY_VALUE
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return EMPTY_VALUE
  if (format === 'long') {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Normalisasi tanggal apapun menjadi `YYYY-MM-DD` untuk `<input type="date">`.
 *
 * Backend bisa mengirim `YYYY-MM-DD`, datetime ISO (`2026-06-16T00:00:00Z`),
 * atau display string. `<input type="date">` HANYA menerima `YYYY-MM-DD`;
 * value lain membuat input kosong/salah. Gunakan helper ini untuk semua
 * `reset()`/default value tanggal di form — JANGAN pakai `formatDate()`
 * (itu khusus display, output localized id-ID).
 *
 * Mengembalikan `''` untuk nilai kosong/invalid (RHF menampilkannya sebagai
 * input kosong, bukan `Invalid Date`).
 */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return ''
    // Sudah `YYYY-MM-DD` (opsional diikuti waktu) → ambil bagian tanggalnya.
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
  }
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatNumber(value: number | string | null | undefined, decimals = 0): string {
  const n = toFiniteNumber(value)
  if (n === null) return EMPTY_VALUE
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}
