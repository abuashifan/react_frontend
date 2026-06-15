export type ProformaStatus = 'draft' | 'issued' | 'accepted' | 'cancelled' | 'converted'

export interface ProformaLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  subtotal: number
}

export interface ProformaInvoice {
  id: number
  number: string
  date: string
  customer_id: number
  customer?: { id: number; code: string; name: string }
  sales_order_id?: number | null
  sales_order_number?: string | null
  status: ProformaStatus
  notes?: string | null
  subtotal: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  lines: ProformaLine[]
  created_at: string
  updated_at: string
}

export interface ProformaListParams {
  page: number
  per_page: number
  search?: string
  status?: ProformaStatus
  customer_id?: number
  date_from?: string
  date_to?: string
}

export interface ProformaLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent?: number
}

export interface CreateProformaPayload {
  customer_id: number
  date: string
  sales_order_id?: number | null
  notes?: string | null
  lines: ProformaLinePayload[]
}

export type UpdateProformaPayload = Partial<CreateProformaPayload>
