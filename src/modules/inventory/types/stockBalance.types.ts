export interface StockBalance {
  id: number
  product_id: number
  product?: { id: number; code: string; name: string; category?: { id: number; name: string } }
  warehouse_id: number
  warehouse?: { id: number; code: string; name: string }
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  average_cost: number
  total_value: number
  last_movement_id?: number | null
  last_movement_at?: string | null
  updated_at: string
}

export interface StockBalanceListParams {
  page: number
  per_page: number
  search?: string
  warehouse_id?: number
  product_category_id?: number
  stock_status?: 'normal' | 'low' | 'negative'
}
