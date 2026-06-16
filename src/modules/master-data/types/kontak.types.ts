export type KontakType = 'customer' | 'supplier' | 'both'

export interface Kontak {
  id: number
  contact_code: string | null
  name: string
  contact_type: KontakType
  phone: string | null
  email: string | null
  address: string | null
  tax_number: string | null
  payment_term_id: number | null
  payment_term?: { id: number; name: string; days: number }
  is_customer: boolean
  is_supplier: boolean
  is_employee: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KontakListParams {
  page: number
  per_page: 25 | 50 | 100
  search?: string
  contact_type?: KontakType
  is_active?: boolean
}

export interface CreateKontakPayload {
  name: string
  contact_type: KontakType
  phone?: string
  email?: string
  address?: string
  tax_number?: string
  payment_term_id?: number | null
}

export type UpdateKontakPayload = Partial<CreateKontakPayload>
