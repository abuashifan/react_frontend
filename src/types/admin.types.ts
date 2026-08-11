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
  status: string
  plan: Pick<AdminPlan, 'id' | 'code' | 'name' | 'max_companies'> | null
  companies_used: number
  companies_limit: number
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

export interface CreateClientPayload {
  name: string
  email: string
  password: string
  plan_id?: number | null
}

export interface UpdateClientPayload {
  name?: string
  email?: string
  status?: string
}
