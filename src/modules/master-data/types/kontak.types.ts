export type KontakType = 'customer' | 'supplier' | 'both'

export interface Kontak {
  id: number
  code: string
  name: string
  type: KontakType
  phone: string | null
  email: string | null
  address: string | null
  npwp: string | null
  payment_term_id: number | null
  payment_term?: { id: number; name: string; days: number }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KontakListParams {
  page: number
  per_page: 25 | 50 | 100
  search?: string
  type?: KontakType
  is_active?: boolean
}

export interface CreateKontakPayload {
  name: string
  type: KontakType
  phone?: string
  email?: string
  address?: string
  npwp?: string
  payment_term_id?: number | null
}

export type UpdateKontakPayload = Partial<CreateKontakPayload>
