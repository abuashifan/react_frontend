export interface KategoriProduk {
  id: number
  name: string
  parent_category_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateKategoriProdukPayload {
  name: string
  parent_category_id?: number | null
}

export type UpdateKategoriProdukPayload = Partial<CreateKategoriProdukPayload>
