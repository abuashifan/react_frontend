export type SalesInvoiceStatus = 'draft' | 'approved' | 'posted' | 'partially_paid' | 'paid' | 'void'

export interface SalesInvoiceLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
  subtotal: number
  tax_amount: number
  returned_quantity: number
}

export interface SalesInvoice {
  id: number
  number: string
  date: string
  due_date?: string | null
  customer_id: number
  customer?: { id: number; code: string; name: string }
  payment_term_id?: number | null
  payment_term?: { id: number; name: string; days: number } | null
  sales_order_id?: number | null
  sales_order_number?: string | null
  delivery_order_id?: number | null
  delivery_order_number?: string | null
  proforma_id?: number | null
  proforma_number?: string | null
  status: SalesInvoiceStatus
  notes?: string | null
  subtotal: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  paid_amount: number
  returned_amount: number
  balance_due: number
  lines: SalesInvoiceLine[]
  created_at: string
  updated_at: string
}

export interface SalesInvoiceListParams {
  page: number
  per_page: number
  search?: string
  status?: SalesInvoiceStatus
  customer_id?: number
  date_from?: string
  date_to?: string
  due_from?: string
  due_to?: string
}

export interface SalesInvoiceLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent?: number
  tax_percent?: number
}

export interface CreateSalesInvoicePayload {
  customer_id: number
  date: string
  due_date?: string | null
  payment_term_id?: number | null
  sales_order_id?: number | null
  delivery_order_id?: number | null
  proforma_id?: number | null
  notes?: string | null
  lines: SalesInvoiceLinePayload[]
}

export type UpdateSalesInvoicePayload = Partial<CreateSalesInvoicePayload>
