export type VendorBillStatus = 'draft' | 'approved' | 'posted' | 'partially_paid' | 'paid' | 'void'

export interface VendorBillLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
  subtotal: number
  returned_quantity: number
}

export interface VendorBill {
  id: number
  number: string
  date: string
  due_date?: string | null
  vendor_id: number
  vendor?: { id: number; code: string; name: string }
  payment_term_id?: number | null
  payment_term?: { id: number; name: string; days: number } | null
  notes?: string | null
  status: VendorBillStatus
  subtotal: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  paid_amount: number
  returned_amount: number
  balance_due: number
  lines: VendorBillLine[]
  purchase_order_id?: number | null
  purchase_order_number?: string | null
  goods_receipt_id?: number | null
  goods_receipt_number?: string | null
  created_at: string
  updated_at: string
}

export interface VendorBillListParams {
  page: number
  per_page: number
  search?: string
  status?: VendorBillStatus
  vendor_id?: number
  date_from?: string
  date_to?: string
  due_date_to?: string
}

export interface VendorBillLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent?: number
  tax_percent?: number
}

export interface CreateVendorBillPayload {
  vendor_id: number
  date: string
  due_date?: string | null
  payment_term_id?: number | null
  notes?: string | null
  lines: VendorBillLinePayload[]
}

export type UpdateVendorBillPayload = Partial<CreateVendorBillPayload>
