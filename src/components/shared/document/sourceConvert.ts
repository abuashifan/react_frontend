import type { SelectOption } from '@/types/common.types'

export interface SourcePreviewLine {
  id: number
  label: string
  quantity: number
  unitPrice: number | null
}

/** Satu jenis dokumen sumber yang bisa diambil oleh `SourceConvertPanel`. */
export interface SourceConvertOption {
  key: string
  /** Label tombol, mis. "Dari Permintaan". */
  label: string
  placeholder: string
  /** Cari dokumen sumber yang masih bisa diambil. `partnerId` diisi bila sumber disaring per vendor/pelanggan. */
  search: (query: string, partnerId: number | null) => Promise<SelectOption<number>[]>
  /** Baris yang akan diambil (opsional). */
  preview?: (id: number) => Promise<SourcePreviewLine[]>
  /** Vendor/pelanggan yang harus dipilih (mis. PO dari Permintaan butuh vendor). */
  partner?: {
    label: string
    cacheKey: string
    required: boolean
    /** Sumber disaring berdasarkan pihak ini. */
    filterBy?: boolean
    search: (query: string) => Promise<SelectOption<number>[]>
  }
  /** Buat dokumen baru dari sumber; kembalikan id dan nomornya. */
  convert: (id: number, partnerId: number | null) => Promise<{ id: number; number: string | null }>
}

/** Nomor dokumen dari respons backend mentah atau hasil adapter. */
export function documentNumber(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  if (typeof record.number === 'string') return record.number
  const key = Object.keys(record).find((name) => name.endsWith('_number') && typeof record[name] === 'string' && name !== 'source_number')
  return key ? (record[key] as string) : null
}

export function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : 0
}
