export type GoodsReceiptStatus = 'draft' | 'received' | 'partially_billed' | 'void' | 'cancelled'

export interface GoodsReceiptLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  billed_quantity: number
  returned_quantity: number
}

export interface GoodsReceipt {
  id: number
  number: string
  date: string
  vendor_id: number
  vendor?: { id: number; code: string; name: string }
  warehouse_id?: number | null
  warehouse?: { id: number; name: string } | null
  notes?: string | null
  status: GoodsReceiptStatus
  lines: GoodsReceiptLine[]
  purchase_order_id?: number | null
  purchase_order_number?: string | null
  created_at: string
  updated_at: string
}

export interface RawGoodsReceiptLine {
  id: number
  product_id: number | null
  product?: { id: number; product_code: string; product_name: string } | null
  description: string
  quantity: number | string
  billed_quantity: number | string
  returned_quantity: number | string
}

export interface RawGoodsReceipt {
  id: number
  receipt_number: string
  receipt_date: string
  vendor_id: number
  vendor?: { id: number; contact_code: string; name: string } | null
  warehouse_id?: number | null
  warehouse?: { id: number; name: string } | null
  notes?: string | null
  status: GoodsReceiptStatus
  lines: RawGoodsReceiptLine[]
  purchase_order_id?: number | null
  purchase_order?: { id: number; order_number: string } | null
  purchase_order_number?: string | null
  created_at: string
  updated_at: string
}

export interface GoodsReceiptListParams {
  page: number
  per_page: number
  search?: string
  status?: GoodsReceiptStatus
  vendor_id?: number
  warehouse_id?: number
  date_from?: string
  date_to?: string
}

export interface GoodsReceiptLinePayload {
  product_id?: number | null
  description: string
  quantity: number
}

export interface CreateGoodsReceiptPayload {
  vendor_id: number
  receipt_date: string
  warehouse_id?: number | null
  notes?: string | null
  lines: GoodsReceiptLinePayload[]
}
