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

export interface RawPurchaseReturnLine {
  id: number
  vendor_bill_line_id?: number | null
  goods_receipt_line_id?: number | null
  product_id: number | null
  product?: { id: number; product_code: string; product_name: string } | null
  description: string
  quantity: number | string
  unit_price: number | string
  subtotal?: number | string
  line_total?: number | string
}

export interface RawPurchaseReturn {
  id: number
  return_number: string
  return_date: string
  vendor_id: number
  vendor?: { id: number; contact_code?: string; contact_number?: string; code?: string; name: string } | null
  notes?: string | null
  status: PurchaseReturnStatus
  grand_total: number | string
  lines: RawPurchaseReturnLine[]
  vendor_bill_id?: number | null
  vendor_bill?: { id: number; bill_number: string } | null
  vendor_bill_number?: string | null
  goods_receipt_id?: number | null
  goods_receipt?: { id: number; receipt_number: string } | null
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
  return_date: string
  notes?: string | null
  lines: PurchaseReturnLinePayload[]
}
