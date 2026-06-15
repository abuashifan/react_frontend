export interface Gudang {
  id: number
  name: string
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateGudangPayload {
  name: string
  address?: string
  is_active?: boolean
}

export type UpdateGudangPayload = Partial<CreateGudangPayload>
