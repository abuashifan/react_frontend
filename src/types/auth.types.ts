export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  permissions?: string[]
}

export interface CompanySettings {
  auto_post: boolean
  require_approval: boolean
  currency: string
  timezone: string
  session_timeout_minutes: number
  onboarding_completed?: boolean
}

export interface Company {
  id: number
  name: string
  code?: string | null
  legal_name?: string | null
  slug?: string | null
  status?: string
  user_role?: string | null
  tenant_database?: Record<string, unknown> | null
  logo?: string
  last_accessed_at: string | null
  settings: CompanySettings
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  token_type?: string
  user: User
}

export interface PermissionsResponse {
  role: string | null
  permission_mode: string
  permissions: string[]
}

export interface BackendCompany {
  id: number
  name: string
  code?: string | null
  legal_name?: string | null
  slug?: string | null
  status?: string
  user_role?: string | null
  tenant_database?: Record<string, unknown> | null
  logo?: string
  last_accessed_at?: string | null
  settings?: Partial<CompanySettings> | null
}

export interface SelectCompanyResponse {
  active_company: BackendCompany
}
