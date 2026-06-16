export interface Gudang {
  id: number
  code: string
  name: string
  address: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateGudangPayload {
  code: string
  name: string
  address?: string
  is_default?: boolean
  is_active?: boolean
}

export type UpdateGudangPayload = Partial<CreateGudangPayload>
