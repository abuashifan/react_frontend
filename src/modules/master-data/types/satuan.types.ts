export interface Satuan {
  id: number
  name: string
  symbol: string
  decimal_places: number
  created_at: string
  updated_at: string
}

export interface CreateSatuanPayload {
  name: string
  symbol: string
  decimal_places?: number
}

export type UpdateSatuanPayload = Partial<CreateSatuanPayload>
