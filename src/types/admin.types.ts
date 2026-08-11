export interface AdminUser {
  id: number
  name: string
  email: string
  is_platform_admin: true
}

export interface AdminLoginResponse {
  user: AdminUser
  token: string
  token_type?: string
}

export interface AdminPlan {
  id: number
  code: string
  name: string
  max_companies: number
  max_users: number
}

export interface ClientUser {
  id: number
  name: string
  email: string
  phone: string | null
  /** Tempat client bekerja — informasi kontak, bukan perusahaan tenant miliknya. */
  company_name: string | null
  job_title: string | null
  address: string | null
  notes: string | null
  status: string
  plan: Pick<AdminPlan, 'id' | 'code' | 'name' | 'max_companies'> | null
  /** null berarti kuota mengikuti paket; angka berarti kuota khusus. */
  company_quota: number | null
  companies_used: number
  companies_limit: number
  limit_source: 'plan' | 'custom'
  /** Client yang paketnya diturunkan setelah terlanjur punya banyak perusahaan. */
  over_quota: boolean
  last_login_at: string | null
  created_at: string | null
}

export interface ClientUserListParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  plan_id?: number
}

/** Bagian yang sama antara membuat dan mengubah client. */
export interface ClientProfileFields {
  phone?: string | null
  company_name?: string | null
  job_title?: string | null
  address?: string | null
  notes?: string | null
  plan_id?: number | null
  company_quota?: number | null
}

export interface CreateClientPayload extends ClientProfileFields {
  name: string
  email: string
  password: string
}

export interface UpdateClientPayload extends ClientProfileFields {
  name?: string
  email?: string
  status?: string
}
