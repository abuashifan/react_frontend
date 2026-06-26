export type VendorBillStatus = 'draft' | 'approved' | 'posted' | 'partially_paid' | 'paid' | 'void'

export type VendorBillLineClassification = 'inventory' | 'fixed_asset'

export interface VendorBillLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  line_classification: VendorBillLineClassification
  fixed_asset_category_id: number | null
  fixed_asset_category?: { id: number; name: string; code: string } | null
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
  applied_vendor_deposit_amount?: number
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
  status?: string // satu status atau beberapa comma-separated (mis. "draft,posted")
  vendor_id?: number
  date_from?: string
  date_to?: string
  due_date_to?: string
}

// --- UI line input (dari form, sebelum diadapter ke payload backend) ---
export interface VendorBillLineInput {
  product_id: number | null
  line_classification: VendorBillLineClassification
  fixed_asset_category_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
}

// --- Payload request canonical backend (A13-161) ---
export interface VendorBillLinePayload {
  line_classification: VendorBillLineClassification
  product_id: number | null
  fixed_asset_category_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_type: 'percent' | 'fixed_amount'
  discount_value: number
  tax_rate: number
}

export interface CreateVendorBillPayload {
  vendor_id: number
  bill_date: string
  due_date?: string | null
  payment_term_id?: number | null
  applied_vendor_deposit_amount?: number | null
  notes?: string | null
  lines: VendorBillLinePayload[]
}

export type UpdateVendorBillPayload = Partial<CreateVendorBillPayload>

// --- Raw response backend (A13-162) — nama kolom DB, dipetakan oleh vendorBillAdapter ---
export interface RawVendorBillLine {
  id: number
  product_id: number | null
  product_code?: string | null
  product?: { id: number; product_code: string; product_name: string } | null
  line_classification: VendorBillLineClassification | null
  fixed_asset_category_id: number | null
  fixed_asset_category?: { id: number; name: string; code: string } | null
  description: string
  quantity: number | string
  returned_quantity: number | string
  unit_price: number | string
  discount_type: 'percent' | 'fixed_amount' | null
  discount_value: number | string | null
  tax_rate: number | string | null
  subtotal_after_discount: number | string
  line_total: number | string
}

export interface RawVendorBill {
  id: number
  bill_number: string
  bill_date: string
  due_date?: string | null
  vendor_id: number
  vendor?: { id: number; contact_code: string; name: string } | null
  payment_term_id?: number | null
  payment_term?: { id: number; name: string; days: number } | null
  applied_vendor_deposit_amount?: number | string | null
  status: VendorBillStatus
  subtotal_before_discount: number | string
  subtotal_after_discount: number | string
  line_discount_total: number | string
  header_discount_amount: number | string
  tax_total: number | string
  grand_total: number | string
  paid_amount: number | string
  returned_amount: number | string
  balance_due: number | string
  purchase_order_id?: number | null
  purchase_order?: { id: number; order_number: string } | null
  goods_receipt_id?: number | null
  goods_receipt?: { id: number; receipt_number: string } | null
  notes?: string | null
  lines: RawVendorBillLine[]
  created_at: string
  updated_at: string
}
