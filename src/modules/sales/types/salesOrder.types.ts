export type SalesOrderStatus = 'draft' | 'approved' | 'confirmed' | 'cancelled' | 'closed'

export interface SalesOrderLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  subtotal: number
  delivered_quantity: number
  invoiced_quantity: number
  returned_quantity: number
}

export interface SalesOrder {
  id: number
  number: string
  date: string
  customer_id: number
  customer?: { id: number; code: string; name: string }
  payment_term_id?: number | null
  payment_term?: { id: number; name: string; days: number } | null
  delivery_address?: string | null
  status: SalesOrderStatus
  notes?: string | null
  subtotal: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  lines: SalesOrderLine[]
  quotation_id?: number | null
  quotation_number?: string | null
  created_at: string
  updated_at: string
}

export interface SalesOrderListParams {
  page: number
  per_page: number
  search?: string
  status?: SalesOrderStatus
  customer_id?: number
  date_from?: string
  date_to?: string
}

export interface SalesOrderLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent?: number
}

export interface CreateSalesOrderPayload {
  customer_id: number
  date: string
  payment_term_id?: number | null
  delivery_address?: string | null
  notes?: string | null
  lines: SalesOrderLinePayload[]
}

export type UpdateSalesOrderPayload = Partial<CreateSalesOrderPayload>
