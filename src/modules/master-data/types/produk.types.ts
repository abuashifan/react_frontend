export interface Produk {
  id: number
  code: string
  name: string
  category_id: number | null
  category?: { id: number; name: string }
  unit_id: number | null
  unit?: { id: number; name: string; symbol: string }
  is_stock_item: boolean
  sell_price: string
  buy_price: string
  coa_sales_id: number | null
  coa_sales?: { id: number; code: string; name: string }
  coa_purchase_id: number | null
  coa_purchase?: { id: number; code: string; name: string }
  coa_inventory_id: number | null
  coa_inventory?: { id: number; code: string; name: string }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProdukListParams {
  page: number
  per_page: 25 | 50 | 100
  search?: string
  category_id?: number
  is_active?: boolean
}

export interface CreateProdukPayload {
  name: string
  category_id?: number | null
  unit_id?: number | null
  is_stock_item: boolean
  sell_price?: number
  buy_price?: number
  coa_sales_id?: number | null
  coa_purchase_id?: number | null
  coa_inventory_id?: number | null
}

export type UpdateProdukPayload = Partial<CreateProdukPayload>
