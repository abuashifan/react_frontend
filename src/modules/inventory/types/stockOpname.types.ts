export type StockOpnameStatus = 'draft' | 'counted' | 'finalized' | 'void'

export interface StockOpnameLine {
  id: number
  product_id: number
  product?: { id: number; code: string; name: string }
  warehouse_id: number
  warehouse?: { id: number; name: string } | null
  unit_id?: number | null
  unit?: { id: number; name: string; code: string } | null
  system_quantity: number
  physical_quantity: number | null
  difference_quantity: number | null
  average_cost: number
  difference_value: number | null
  counted_at?: string | null
}

export interface StockOpname {
  id: number
  number: string
  opname_date: string
  warehouse_id: number
  warehouse?: { id: number; code: string; name: string }
  notes?: string | null
  status: StockOpnameStatus
  lines: StockOpnameLine[]
  counted_at?: string | null
  finalized_at?: string | null
  created_at: string
  updated_at: string
}

export interface StockOpnameListParams {
  page: number
  per_page: number
  search?: string
  warehouse_id?: number
  status?: StockOpnameStatus
  date_from?: string
  date_to?: string
}

export interface CreateStockOpnamePayload {
  opname_date: string
  warehouse_id: number
  notes?: string | null
}
