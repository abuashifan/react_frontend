export type CoaType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface Coa {
  id: number
  code: string
  name: string
  type: CoaType
  parent_id: number | null
  parent?: { id: number; code: string; name: string }
  description: string | null
  is_active: boolean
  level: number
  children?: Coa[]
  created_at: string
  updated_at: string
}

export interface CoaListParams {
  page: number
  per_page: 25 | 50 | 100
  search?: string
  type?: CoaType
  is_active?: boolean
}

export interface CreateCoaPayload {
  code: string
  name: string
  type: CoaType
  parent_id?: number | null
  description?: string
}

export type UpdateCoaPayload = Partial<CreateCoaPayload>
