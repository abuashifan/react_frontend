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

export function formatNumber(value: number | string | null | undefined, decimals = 0): string {
  const n = toFiniteNumber(value)
  if (n === null) return EMPTY_VALUE
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}
