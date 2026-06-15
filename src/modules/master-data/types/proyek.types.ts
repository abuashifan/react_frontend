export type ProyekStatus = 'active' | 'completed' | 'cancelled'

export interface Proyek {
  id: number
  code: string
  name: string
  status: ProyekStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateProyekPayload {
  name: string
  status?: ProyekStatus
  start_date?: string
  end_date?: string
}

export type UpdateProyekPayload = Partial<CreateProyekPayload>
