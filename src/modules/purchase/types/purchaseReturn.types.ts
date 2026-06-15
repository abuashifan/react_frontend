export type PurchaseReturnStatus = 'draft' | 'approved' | 'posted' | 'void'

export interface PurchaseReturnLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface PurchaseReturn {
  id: number
  number: string
  date: string
  vendor_id: number
  vendor?: { id: number; code: string; name: string }
  notes?: string | null
  status: PurchaseReturnStatus
  total: number
  lines: PurchaseReturnLine[]
  vendor_bill_id?: number | null
  vendor_bill_number?: string | null
  goods_receipt_id?: number | null
  goods_receipt_number?: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseReturnListParams {
  page: number
  per_page: number
  search?: string
  status?: PurchaseReturnStatus
  vendor_id?: number
  date_from?: string
  date_to?: string
}

export interface PurchaseReturnLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
}

export interface CreatePurchaseReturnPayload {
  vendor_id: number
  date: string
  notes?: string | null
  lines: PurchaseReturnLinePayload[]
}
