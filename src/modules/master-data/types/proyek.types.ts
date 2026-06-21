export type ProyekStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'

export interface Proyek {
  id: number
  code: string
  name: string
  description: string | null
  status: ProyekStatus
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProyekPayload {
  code: string
  name: string
  description?: string
  status?: ProyekStatus
  start_date?: string
  end_date?: string
}

export type UpdateProyekPayload = Partial<CreateProyekPayload>
