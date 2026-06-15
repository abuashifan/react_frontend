export type StockMovementType =
  | 'purchase_in'
  | 'purchase_return_out'
  | 'sales_out'
  | 'sales_return_in'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'opening_stock'
  | 'opname_in'
  | 'opname_out'
  | 'transfer_in'
  | 'transfer_out'

export type StockMovementStatus = 'draft' | 'posted' | 'void'

export interface StockMovementLine {
  id: number
  product_id: number
  product?: { id: number; code: string; name: string }
  warehouse_id: number
  warehouse?: { id: number; code: string; name: string }
  unit_id?: number | null
  unit?: { id: number; name: string; code: string } | null
  quantity: number
  unit_cost: number
  total_cost: number
  quantity_before: number
  quantity_after: number
}

export interface StockMovement {
  id: number
  number: string
  movement_date: string
  movement_type: StockMovementType
  warehouse_id?: number | null
  warehouse?: { id: number; name: string } | null
  description?: string | null
  notes?: string | null
  status: StockMovementStatus
  total_quantity: number
  total_value: number
  source_type?: string | null
  source_number?: string | null
  lines: StockMovementLine[]
  created_at: string
  updated_at: string
}

export interface StockMovementListParams {
  page: number
  per_page: number
  search?: string
  movement_type?: StockMovementType
  warehouse_id?: number
  product_id?: number
  status?: StockMovementStatus
  date_from?: string
  date_to?: string
}

export interface StockMovementLinePayload {
  product_id: number
  warehouse_id: number
  unit_id?: number | null
  quantity: number
  unit_cost?: number | null
}

export interface CreateStockMovementPayload {
  movement_date: string
  movement_type: StockMovementType
  warehouse_id?: number | null
  description?: string | null
  notes?: string | null
  lines: StockMovementLinePayload[]
}
