export interface StockBalanceProduct {
  id: number
  code: string | null
  name: string | null
  description: string | null
}

export interface StockBalanceWarehouse {
  id: number
  code: string | null
  name: string | null
}

export interface StockBalance {
  id: number
  product_id: number
  product?: StockBalanceProduct
  warehouse_id: number
  warehouse?: StockBalanceWarehouse
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  average_cost: number
  total_value: number
  last_movement_id?: number | null
  last_movement_at?: string | null
  updated_at?: string
}

export interface StockBalanceListParams {
  page: number
  per_page: 25 | 50 | 100
  warehouse_id?: number
  product_id?: number
  has_stock?: boolean
}
