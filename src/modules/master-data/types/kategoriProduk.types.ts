export interface KategoriProduk {
  id: number
  name: string
  description: string | null
  product_count: number
  created_at: string
  updated_at: string
}

export interface CreateKategoriProdukPayload {
  name: string
  description?: string
}

export type UpdateKategoriProdukPayload = Partial<CreateKategoriProdukPayload>
