export type ProyekStatus = 'active' | 'completed' | 'cancelled'

export interface Proyek {
  id: number
  code: string
  name: string
  /** Siklus proyek. Berbeda dari `is_active` — lihat catatan di bawah. */
  status: ProyekStatus
  /**
   * Dipakai/tidak, sumbu terpisah dari `status`. Kolomnya sudah lama ada di
   * backend (`projects.is_active`) tapi tidak pernah dideklarasikan di sini,
   * sehingga daftar proyek tidak bisa menampilkan atau menyaringnya.
   */
  is_active: boolean
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
