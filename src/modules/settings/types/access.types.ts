// Types untuk Access Management (/access/*). Mengikuti payload backend aktual
// (lihat app/Http/Controllers/Api/Access/*). Phase 9 — spec-27 / gap-02.

export type CompanyUserStatus = 'active' | 'inactive' | 'pending'

export interface CompanyUser {
  id: number
  company_id: number
  user_id: number
  name: string | null
  email: string | null
  /** Slug role bawaan (mis. 'admin'); bisa null jika role kustom. */
  role: string | null
  role_id: number | null
  role_name: string | null
  status: CompanyUserStatus
  joined_at: string | null
}

export interface PermissionOverride {
  permission_key: string | null
  effect: 'allow' | 'deny'
  reason: string | null
}

export interface CompanyUserPermissions {
  company_user: CompanyUser
  role_permission_keys: string[]
  allow_override_keys: string[]
  deny_override_keys: string[]
  effective_permission_keys: string[]
  overrides: PermissionOverride[]
}

export interface AccessRole {
  id: number
  company_id?: number | null
  name: string
  slug?: string | null
  description?: string | null
  is_system?: boolean
  is_active: boolean
  // index() pakai withCount → *_count; detail (rolePayload) pakai assigned_users_count
  permissions_count?: number
  company_users_count?: number
  assigned_users_count?: number
  permission_keys?: string[]
  permissions?: PermissionDefinition[]
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export interface Invitation {
  id: number
  email: string
  role: string | null
  status: InvitationStatus
  invited_by?: number | string | null
  expires_at?: string | null
  accepted_at?: string | null
  created_at: string
}

export interface AuditEntry {
  id: number
  action: string
  module: string
  description: string | null
  ip_address?: string | null
  created_at: string
  user?: { id: number; name: string; email: string } | null
}

// Permission catalog (GET /access/permission-catalog → PermissionCatalogService::grouped)
export interface PermissionDefinition {
  key: string
  label: string
  module?: string
  feature?: string
  action?: string
  matrix_column?: string | null
  is_special?: boolean
}

export interface PermissionFeature {
  key: string
  label: string
  permissions: Record<string, PermissionDefinition>
}

export interface PermissionModule {
  key: string
  label: string
  features: PermissionFeature[]
  special_permissions: PermissionDefinition[]
}

export interface PermissionCatalog {
  matrix_columns: string[]
  modules: PermissionModule[]
}

// Payloads
export interface UpdateUserRolePayload {
  role_id?: number | null
  role?: string | null
}

export interface CreateRolePayload {
  name: string
  description?: string | null
  is_active?: boolean
}

export type UpdateRolePayload = Partial<CreateRolePayload>

export interface CreateInvitationPayload {
  email: string
  role?: string | null
  role_id?: number | null
  expires_at?: string | null
}

export interface AuditListParams {
  user_id?: number
  role_id?: number
  action?: string
  date_from?: string
  date_to?: string
}
