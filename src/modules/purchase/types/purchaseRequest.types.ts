export type PurchaseRequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'converted'

export interface PurchaseRequestLine {
  id: number
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_id?: number | null
  unit?: { id: number; name: string } | null
  estimated_price: number
  subtotal: number
}

export interface PurchaseRequest {
  id: number
  number: string
  date: string
  department_id?: number | null
  department?: { id: number; name: string } | null
  requester_id?: number | null
  notes?: string | null
  status: PurchaseRequestStatus
  total_estimated: number
  lines: PurchaseRequestLine[]
  created_at: string
  updated_at: string
}

export interface RawPurchaseRequestLine {
  id: number
  product_id: number | null
  product?: { id: number; product_code: string; product_name: string } | null
  description: string
  quantity: number | string
  unit_id?: number | null
  unit?: { id: number; name: string } | null
  estimated_unit_price: number | string
  subtotal: number | string
}

export interface RawPurchaseRequest {
  id: number
  request_number: string
  request_date: string
  needed_date?: string | null
  department_id?: number | null
  department?: { id: number; name: string } | null
  requester_id?: number | null
  requester?: { id: number; name: string } | null
  notes?: string | null
  status: PurchaseRequestStatus
  estimated_total: number | string
  lines: RawPurchaseRequestLine[]
  created_at: string
  updated_at: string
}

export interface PurchaseRequestListParams {
  page: number
  per_page: number
  search?: string
  status?: PurchaseRequestStatus
  department_id?: number
  date_from?: string
  date_to?: string
}

export interface PurchaseRequestLinePayload {
  product_id?: number | null
  description: string
  quantity: number
  unit_id?: number | null
  estimated_unit_price?: number
}

export interface CreatePurchaseRequestPayload {
  request_date: string
  department_id?: number | null
  notes?: string | null
  lines: PurchaseRequestLinePayload[]
}

export type UpdatePurchaseRequestPayload = Partial<CreatePurchaseRequestPayload>
