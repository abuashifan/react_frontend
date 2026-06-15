export type SalesReturnStatus = 'draft' | 'approved' | 'posted' | 'void'

export interface SalesReturnLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  subtotal: number
  sales_invoice_line_id?: number | null
}

export interface SalesReturn {
  id: number
  number: string
  date: string
  customer_id: number
  customer?: { id: number; code: string; name: string }
  sales_invoice_id?: number | null
  sales_invoice_number?: string | null
  delivery_order_id?: number | null
  delivery_order_number?: string | null
  status: SalesReturnStatus
  notes?: string | null
  subtotal: number
  tax_amount: number
  grand_total: number
  lines: SalesReturnLine[]
  created_at: string
  updated_at: string
}

export interface SalesReturnListParams {
  page: number
  per_page: number
  search?: string
  status?: SalesReturnStatus
  customer_id?: number
  date_from?: string
  date_to?: string
}

export interface SalesReturnLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  sales_invoice_line_id?: number | null
}

export interface CreateSalesReturnPayload {
  customer_id: number
  date: string
  sales_invoice_id?: number | null
  delivery_order_id?: number | null
  notes?: string | null
  lines: SalesReturnLinePayload[]
}

export type UpdateSalesReturnPayload = Partial<CreateSalesReturnPayload>
