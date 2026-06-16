export type ProductType = 'goods' | 'service' | 'non_inventory' | 'fixed_asset'

export interface Produk {
  id: number
  product_code: string | null
  product_name: string
  product_type: ProductType
  product_category_id: number | null
  category?: { id: number; name: string }
  unit_id: number | null
  unit?: { id: number; name: string; code: string }
  is_stock_item: boolean
  is_active: boolean
  description: string | null
  sales_account_id: number | null
  sales_account?: { id: number; account_code: string; account_name: string }
  purchase_account_id: number | null
  purchase_account?: { id: number; account_code: string; account_name: string }
  inventory_account_id: number | null
  inventory_account?: { id: number; account_code: string; account_name: string }
  cogs_account_id: number | null
  cogs_account?: { id: number; account_code: string; account_name: string }
  created_at: string
  updated_at: string
}

export interface ProdukListParams {
  page: number
  per_page: 25 | 50 | 100
  search?: string
  product_category_id?: number
  is_active?: boolean
}

export interface CreateProdukPayload {
  product_code?: string | null
  product_name: string
  product_type?: ProductType
  product_category_id?: number | null
  unit_id?: number | null
  is_stock_item?: boolean
  is_active?: boolean
  description?: string
  sales_account_id?: number | null
  purchase_account_id?: number | null
  inventory_account_id?: number | null
  cogs_account_id?: number | null
}

export type UpdateProdukPayload = Partial<CreateProdukPayload>
