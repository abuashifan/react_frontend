// Sumber dokumen untuk Vendor Bill (A13-165): pilih PO/GR eligible + preview remaining qty.
// Membaca field RAW PO/GR langsung karena resource tersebut belum diadapter (A13-162),
// sehingga picker tidak tergantung migrasi PO/GR.
import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'

export type BillSourceType = 'purchase_order' | 'goods_receipt'

interface RawSourceListItem {
  id: number
  order_number?: string
  receipt_number?: string
  status: string
  vendor?: { name?: string } | null
}

interface RawSourceLine {
  id: number
  description?: string | null
  product?: { product_name?: string } | null
  product_code?: string | null
  quantity: number | string
  billed_quantity?: number | string | null
  unit_price?: number | string | null
}

interface RawSourceDetail {
  id: number
  order_number?: string
  receipt_number?: string
  lines: RawSourceLine[]
}

export interface BillSourcePreviewLine {
  id: number
  label: string
  remaining: number
  unitPrice: number | null
}

export interface BillSourcePreview {
  number: string
  lines: BillSourcePreviewLine[]
  hasRemaining: boolean
}

const ENDPOINT: Record<BillSourceType, string> = {
  purchase_order: '/purchase/orders',
  goods_receipt: '/purchase/goods-receipts',
}

// Hanya dokumen pada status ini yang masih bisa ditagih.
const ELIGIBLE: Record<BillSourceType, string[]> = {
  purchase_order: ['confirmed', 'partially_billed'],
  goods_receipt: ['received', 'partially_billed'],
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : 0
}

function sourceNumber(item: { order_number?: string; receipt_number?: string }): string {
  return item.order_number ?? item.receipt_number ?? ''
}

export const vendorBillSourceApi = {
  search: async (type: BillSourceType, query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<RawSourceListItem>>(ENDPOINT[type], {
      params: { search: query, per_page: 50, page: 1 },
    })
    return res.data
      .filter((item) => ELIGIBLE[type].includes(item.status))
      .map((item) => ({ value: item.id, label: sourceNumber(item), sublabel: item.vendor?.name ?? undefined }))
  },

  preview: async (type: BillSourceType, id: number): Promise<BillSourcePreview> => {
    const res = await http.get<unknown, ApiResponse<RawSourceDetail>>(`${ENDPOINT[type]}/${id}`)
    const lines = res.data.lines
      .map((line) => ({
        id: line.id,
        label: line.product?.product_name ?? line.product_code ?? line.description ?? 'Item',
        remaining: num(line.quantity) - num(line.billed_quantity),
        unitPrice: line.unit_price != null ? num(line.unit_price) : null,
      }))
      .filter((line) => line.remaining > 0)
    return { number: sourceNumber(res.data), lines, hasRemaining: lines.length > 0 }
  },
}
