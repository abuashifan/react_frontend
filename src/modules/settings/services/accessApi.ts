import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type {
  CompanyUser, CompanyUserPermissions, AccessRole, Invitation, AuditEntry,
  PermissionCatalog, UpdateUserRolePayload, CreateRolePayload, UpdateRolePayload,
  CreateInvitationPayload, AuditListParams,
} from '../types/access.types'

// Catatan: endpoint /access/* mengembalikan successResponse(array) — bukan paginated.
export const accessUsersApi = {
  list: () => http.get<unknown, ApiResponse<CompanyUser[]>>('/access/company-users'),
  get: (id: number) => http.get<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}`),

  // Pencarian pengguna perusahaan untuk picker requester/buyer (value = user_id
  // sesuai kontrak backend Purchase). Endpoint tidak punya param search, jadi
  // difilter di klien.
  searchUsers: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, ApiResponse<CompanyUser[]>>('/access/company-users')
    const q = query.toLowerCase()
    return res.data
      .filter((user) => user.user_id != null && [user.name, user.email].some((label) => (label ?? '').toLowerCase().includes(q)))
      .map((user) => ({ value: user.user_id, label: user.name ?? user.email ?? `User ${user.user_id}`, sublabel: user.email ?? undefined }))
  },
  updateRole: (id: number, payload: UpdateUserRolePayload) =>
    http.patch<unknown, ApiResponse<CompanyUserPermissions>>(`/access/company-users/${id}/role`, payload),
  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}/deactivate`),
  reactivate: (id: number) =>
    http.patch<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}/reactivate`),
  remove: (id: number) =>
    http.patch<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}/remove`),
  getPermissions: (id: number) =>
    http.get<unknown, ApiResponse<CompanyUserPermissions>>(`/access/users/${id}/permissions`),
  updatePermissions: (id: number, permissions: { allow: string[]; deny: string[] }) =>
    http.put<unknown, ApiResponse<CompanyUserPermissions>>(`/access/users/${id}/permissions`, permissions),
  copyAccess: (id: number, sourceCompanyUserId: number) =>
    http.post<unknown, ApiResponse<CompanyUserPermissions>>(`/access/users/${id}/copy-access`, { source_company_user_id: sourceCompanyUserId }),
  resetPermissions: (id: number) =>
    http.post<unknown, ApiResponse<CompanyUserPermissions>>(`/access/users/${id}/reset-permissions`),
}

export const accessRolesApi = {
  list: () => http.get<unknown, ApiResponse<AccessRole[]>>('/access/roles'),
  get: (id: number) => http.get<unknown, ApiResponse<AccessRole>>(`/access/roles/${id}`),
  store: (payload: CreateRolePayload) => http.post<unknown, ApiResponse<AccessRole>>('/access/roles', payload),
  update: (id: number, payload: UpdateRolePayload) => http.patch<unknown, ApiResponse<AccessRole>>(`/access/roles/${id}`, payload),
  clone: (id: number) => http.post<unknown, ApiResponse<AccessRole>>(`/access/roles/${id}/clone`),
  updatePermissions: (id: number, permissions: string[]) =>
    http.put<unknown, ApiResponse<AccessRole>>(`/access/roles/${id}/permissions`, { permissions }),
  deactivate: (id: number) => http.patch<unknown, ApiResponse<AccessRole>>(`/access/roles/${id}/deactivate`),
  reactivate: (id: number) => http.patch<unknown, ApiResponse<AccessRole>>(`/access/roles/${id}/reactivate`),
}

export const accessInvitationsApi = {
  list: () => http.get<unknown, ApiResponse<Invitation[]>>('/access/invitations'),
  store: (payload: CreateInvitationPayload) => http.post<unknown, ApiResponse<Invitation>>('/access/invitations', payload),
  resend: (id: number) => http.post<unknown, ApiResponse<Invitation>>(`/access/invitations/${id}/resend`),
  revoke: (id: number) => http.post<unknown, ApiResponse<Invitation>>(`/access/invitations/${id}/revoke`),
}

export const accessPermissionCatalogApi = {
  get: () => http.get<unknown, ApiResponse<PermissionCatalog>>('/access/permission-catalog'),
}

export const accessAuditApi = {
  list: (params?: AuditListParams) => http.get<unknown, ApiResponse<AuditEntry[]>>('/access/audit', { params }),
}
