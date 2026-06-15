export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'accepted' | 'rejected' | 'cancelled' | 'converted'

export interface SalesQuotationLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  subtotal: number
}

export interface SalesQuotation {
  id: number
  number: string
  date: string
  expiry_date?: string | null
  customer_id: number
  customer?: { id: number; code: string; name: string }
  sales_person_id?: number | null
  sales_person?: { id: number; name: string } | null
  status: QuotationStatus
  notes?: string | null
  subtotal: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  lines: SalesQuotationLine[]
  created_at: string
  updated_at: string
}

export interface SalesQuotationListParams {
  page: number
  per_page: number
  search?: string
  status?: QuotationStatus
  customer_id?: number
  date_from?: string
  date_to?: string
}

export interface QuotationLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent?: number
}

export interface CreateQuotationPayload {
  customer_id: number
  date: string
  expiry_date?: string | null
  notes?: string | null
  lines: QuotationLinePayload[]
}

export type UpdateQuotationPayload = Partial<CreateQuotationPayload>
