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
  applied_down_payment_amount?: number
  available_deposit_summary?: {
    unapplied_total: number
    deposits: Array<{ id: number; deposit_number: string; remaining_amount: number }>
  }
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
  sales_order_line_id?: number
  delivery_order_line_id?: number
  proforma_invoice_line_id?: number
  warehouse_id?: number | null
  source_line_type?: string
  source_line_id?: number
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
  applied_down_payment_amount?: number
  lines: SalesInvoiceLinePayload[]
}

export type UpdateSalesInvoicePayload = Partial<CreateSalesInvoicePayload>
