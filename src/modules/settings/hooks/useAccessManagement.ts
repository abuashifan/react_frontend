import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/modules/auth/services/authApi'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  accessUsersApi, accessInvitationsApi,
  accessPermissionCatalogApi, accessAuditApi,
} from '../services/accessApi'
import type {
  UpdatePermissionsPayload,
  CreateInvitationPayload, AuditListParams,
} from '../types/access.types'

const USERS_KEY = ['access', 'company-users']
const INVITES_KEY = ['access', 'invitations']

// ── Users ──────────────────────────────────────────────────────────────────
export function useCompanyUsers() {
  return useQuery({ queryKey: USERS_KEY, queryFn: accessUsersApi.list })
}
export function useCompanyUserPermissions(id?: number) {
  return useQuery({
    queryKey: ['access', 'users', id, 'permissions'],
    queryFn: () => accessUsersApi.getPermissions(id!),
    enabled: !!id,
  })
}
export function useCompanyUserMutations() {
  const qc = useQueryClient()
  const inv = () => void qc.invalidateQueries({ queryKey: USERS_KEY })
  return {
    updatePermissions: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdatePermissionsPayload }) => accessUsersApi.updatePermissions(id, payload), onSuccess: async (response, { id }) => {
      inv()
      void qc.invalidateQueries({ queryKey: ['access', 'users', id, 'permissions'] })
      if (response.data.company_user.user_id === useAuthStore.getState().user?.id) {
        try { useAuthStore.getState().setPermissions((await authApi.permissions()).data.permissions) }
        catch { useAuthStore.getState().setPermissions([]) }
      }
    } }),
    deactivate: useMutation({ mutationFn: (id: number) => accessUsersApi.deactivate(id), onSuccess: inv }),
    reactivate: useMutation({ mutationFn: (id: number) => accessUsersApi.reactivate(id), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: number) => accessUsersApi.remove(id), onSuccess: inv }),
  }
}

// ── Permission catalog ───────────────────────────────────────────────────────
export function usePermissionCatalog(enabled = true) {
  return useQuery({ queryKey: ['access', 'permission-catalog'], queryFn: accessPermissionCatalogApi.get, staleTime: 5 * 60_000, enabled })
}

// ── Invitations ──────────────────────────────────────────────────────────────
export function useInvitations(enabled = true) {
  return useQuery({ queryKey: INVITES_KEY, queryFn: accessInvitationsApi.list, enabled })
}
export function useInvitationMutations() {
  const qc = useQueryClient()
  const inv = () => void qc.invalidateQueries({ queryKey: INVITES_KEY })
  return {
    create: useMutation({ mutationFn: (p: CreateInvitationPayload) => accessInvitationsApi.store(p), onSuccess: inv }),
    resend: useMutation({ mutationFn: (id: number) => accessInvitationsApi.resend(id), onSuccess: inv }),
    revoke: useMutation({ mutationFn: (id: number) => accessInvitationsApi.revoke(id), onSuccess: inv }),
  }
}

// ── Audit ────────────────────────────────────────────────────────────────────
export function useAccessAudit(params?: AuditListParams) {
  return useQuery({ queryKey: ['access', 'audit', params], queryFn: () => accessAuditApi.list(params) })
}
