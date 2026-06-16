export interface Satuan {
  id: number
  name: string
  code: string
  precision: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateSatuanPayload {
  name: string
  code: string
  precision?: number
}

export type UpdateSatuanPayload = Partial<CreateSatuanPayload>
