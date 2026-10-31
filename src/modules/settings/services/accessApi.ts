import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { User } from '@/types/auth.types'
import type {
  CompanyUser, CompanyUserPermissions, Invitation, InvitationPreview, AuditEntry,
  PermissionCatalog, UpdatePermissionsPayload,
  CreateInvitationPayload, AuditListParams,
} from '../types/access.types'

// Catatan: endpoint /access/* mengembalikan successResponse(array) — bukan paginated.
export const accessUsersApi = {
  list: () => http.get<unknown, ApiResponse<CompanyUser[]>>('/access/company-users'),
  get: (id: number) => http.get<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}`),
  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}/deactivate`),
  reactivate: (id: number) =>
    http.patch<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}/reactivate`),
  remove: (id: number) =>
    http.patch<unknown, ApiResponse<CompanyUser>>(`/access/company-users/${id}/remove`),
  getPermissions: (id: number) =>
    http.get<unknown, ApiResponse<CompanyUserPermissions>>(`/access/users/${id}/permissions`),
  updatePermissions: (id: number, permissions: UpdatePermissionsPayload) =>
    http.put<unknown, ApiResponse<CompanyUserPermissions>>(`/access/users/${id}/permissions`, permissions),
  copyAccess: (id: number, sourceCompanyUserId: number) =>
    http.post<unknown, ApiResponse<CompanyUserPermissions>>(`/access/users/${id}/copy-access`, { source_company_user_id: sourceCompanyUserId }),

}

export const accessInvitationsApi = {
  preview: (token: string) => http.get<unknown, ApiResponse<InvitationPreview>>(`/invitations/${encodeURIComponent(token)}`),
  register: (token: string, payload: { name: string; password: string; password_confirmation: string }) =>
    http.post<unknown, ApiResponse<{ user: User; token: string; token_type: string }>>(`/invitations/${encodeURIComponent(token)}/register`, payload),
  accept: (token: string) => http.post<unknown, ApiResponse<{ company_id: number; company_user_id: number }>>(`/invitations/${encodeURIComponent(token)}/accept`),
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
