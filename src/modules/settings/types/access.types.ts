// Types untuk Access Management (/access/*). Mengikuti payload backend aktual
// (lihat app/Http/Controllers/Api/Access/*). Phase 9 — spec-27 / gap-02.

export type CompanyUserStatus = 'active' | 'inactive' | 'pending' | 'removed'

export interface CompanyUser {
  id: number
  company_id: number
  user_id: number
  name: string | null
  email: string | null
  full_access: boolean
  is_owner: boolean
  feature_count: number
  status: CompanyUserStatus
  joined_at: string | null
}

export interface CompanyUserPermissions {
  company_user: CompanyUser
  full_access: boolean
  is_owner: boolean
  permissions: string[]
  effective_permissions: string[]
  catalog: PermissionCatalog
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export interface Invitation {
  id: number
  email: string
  full_access: boolean
  permissions: string[] | null
  token: string
  status: InvitationStatus
  invited_by?: number | string | null
  expires_at?: string | null
  accepted_at?: string | null
  created_at: string
  /** Hanya ada di respons buat/kirim ulang: tautan terima dan status pengiriman email. */
  accept_url?: string
  mail_sent?: boolean
}

export interface InvitationPreview {
  email: string
  company_name: string
  expires_at: string | null
  has_account: boolean
}

export interface AuditEntry {
  id: number
  action: string
  module: string
  description: string | null
  properties?: { old_values?: unknown; new_values?: unknown } | null
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
  /**
   * Kunci izin yang terkunci paket client saat ini (skema tier, Fase 2).
   * Ditampilkan terkunci, bukan disembunyikan — admin perusahaan tetap tahu
   * izin itu ada dan kenapa mati.
   */
  blocked_by_plan_keys: string[]
  /** Tautan WhatsApp ke penyedia aplikasi; `null` kalau nomornya belum diisi. */
  upgrade_url: string | null
}

// Payloads
export interface UpdatePermissionsPayload {
  full_access: boolean
  permissions: string[]
}

export interface CreateInvitationPayload extends UpdatePermissionsPayload {
  email: string
  expires_at?: string | null
}

export interface AuditListParams {
  user_id?: number
  role_id?: number
  action?: string
  date_from?: string
  date_to?: string
}
