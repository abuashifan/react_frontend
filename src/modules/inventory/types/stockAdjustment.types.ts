export type StockAdjustmentStatus = 'draft' | 'approved' | 'posted' | 'void'
export type StockAdjustmentLineType = 'increase' | 'decrease'

export interface StockAdjustmentLine {
  id: number
  product_id: number
  product?: { id: number; code: string; name: string }
  warehouse_id: number
  warehouse?: { id: number; code: string; name: string }
  unit_id?: number | null
  unit?: { id: number; name: string; code: string } | null
  adjustment_type: StockAdjustmentLineType
  quantity: number
  unit_cost: number
  total_cost: number
  system_quantity_before: number
  reason?: string | null
}

export interface StockAdjustment {
  id: number
  number: string
  adjustment_date: string
  warehouse_id?: number | null
  warehouse?: { id: number; name: string } | null
  reason?: string | null
  notes?: string | null
  status: StockAdjustmentStatus
  lines: StockAdjustmentLine[]
  created_at: string
  updated_at: string
}

export interface StockAdjustmentListParams {
  page: number
  per_page: number
  search?: string
  warehouse_id?: number
  status?: StockAdjustmentStatus
  date_from?: string
  date_to?: string
}

export interface StockAdjustmentLinePayload {
  product_id: number
  warehouse_id: number
  unit_id?: number | null
  adjustment_type: StockAdjustmentLineType
  quantity: number
  unit_cost?: number | null
  reason?: string | null
}

export interface CreateStockAdjustmentPayload {
  adjustment_date: string
  warehouse_id?: number | null
  reason?: string | null
  notes?: string | null
  lines: StockAdjustmentLinePayload[]
}

export type UpdateStockAdjustmentPayload = Partial<CreateStockAdjustmentPayload>
