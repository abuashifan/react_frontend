export type PurchaseOrderStatus = 'draft' | 'approved' | 'confirmed' | 'cancelled' | 'closed'

export interface PurchaseOrderLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  subtotal: number
  received_quantity: number
  billed_quantity: number
  returned_quantity: number
}

export interface PurchaseOrder {
  id: number
  number: string
  date: string
  vendor_id: number
  vendor?: { id: number; code: string; name: string }
  payment_term_id?: number | null
  payment_term?: { id: number; name: string; days: number } | null
  expected_delivery_date?: string | null
  notes?: string | null
  status: PurchaseOrderStatus
  subtotal: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  lines: PurchaseOrderLine[]
  purchase_request_id?: number | null
  purchase_request_number?: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseOrderListParams {
  page: number
  per_page: number
  search?: string
  status?: PurchaseOrderStatus
  vendor_id?: number
  date_from?: string
  date_to?: string
}

export interface PurchaseOrderLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent?: number
}

export interface CreatePurchaseOrderPayload {
  vendor_id: number
  date: string
  payment_term_id?: number | null
  expected_delivery_date?: string | null
  notes?: string | null
  lines: PurchaseOrderLinePayload[]
}

export type UpdatePurchaseOrderPayload = Partial<CreatePurchaseOrderPayload>
