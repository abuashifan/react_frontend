/**
 * `on_hold` ada di allowlist backend (`StoreProjectRequest`) tapi dulu tidak
 * dideklarasikan di sini, sehingga proyek yang di-`on_hold` lewat API membuat
 * dropdown status kehilangan nilainya.
 */
export type ProyekStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'

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
  description: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateProyekPayload {
  /**
   * Wajib — `StoreProjectRequest` menandainya `required` dan backend tidak
   * membangkitkannya. Tanpa field ini di payload, membuat proyek selalu 422.
   */
  code: string
  name: string
  description?: string | null
  status?: ProyekStatus
  start_date?: string
  end_date?: string
}

export type UpdateProyekPayload = Partial<CreateProyekPayload>
