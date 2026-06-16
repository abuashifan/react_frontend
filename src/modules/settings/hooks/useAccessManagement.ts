import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  accessUsersApi, accessRolesApi, accessInvitationsApi,
  accessPermissionCatalogApi, accessAuditApi,
} from '../services/accessApi'
import type {
  UpdateUserRolePayload, CreateRolePayload, UpdateRolePayload,
  CreateInvitationPayload, AuditListParams,
} from '../types/access.types'

const USERS_KEY = ['access', 'company-users']
const ROLES_KEY = ['access', 'roles']
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
    updateRole: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateUserRolePayload }) => accessUsersApi.updateRole(id, payload), onSuccess: inv }),
    deactivate: useMutation({ mutationFn: (id: number) => accessUsersApi.deactivate(id), onSuccess: inv }),
    reactivate: useMutation({ mutationFn: (id: number) => accessUsersApi.reactivate(id), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: number) => accessUsersApi.remove(id), onSuccess: inv }),
  }
}

// ── Roles ──────────────────────────────────────────────────────────────────
export function useAccessRoles() {
  return useQuery({ queryKey: ROLES_KEY, queryFn: accessRolesApi.list })
}
export function useAccessRole(id?: number) {
  return useQuery({ queryKey: [...ROLES_KEY, id], queryFn: () => accessRolesApi.get(id!), enabled: !!id })
}
export function useAccessRoleMutations() {
  const qc = useQueryClient()
  const inv = (id?: number) => {
    void qc.invalidateQueries({ queryKey: ROLES_KEY })
    if (id) void qc.invalidateQueries({ queryKey: [...ROLES_KEY, id] })
  }
  return {
    create: useMutation({ mutationFn: (p: CreateRolePayload) => accessRolesApi.store(p), onSuccess: () => inv() }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateRolePayload }) => accessRolesApi.update(id, payload), onSuccess: (_, { id }) => inv(id) }),
    clone: useMutation({ mutationFn: (id: number) => accessRolesApi.clone(id), onSuccess: () => inv() }),
    updatePermissions: useMutation({ mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) => accessRolesApi.updatePermissions(id, permissions), onSuccess: (_, { id }) => inv(id) }),
    deactivate: useMutation({ mutationFn: (id: number) => accessRolesApi.deactivate(id), onSuccess: () => inv() }),
    reactivate: useMutation({ mutationFn: (id: number) => accessRolesApi.reactivate(id), onSuccess: () => inv() }),
  }
}

// ── Permission catalog ───────────────────────────────────────────────────────
export function usePermissionCatalog() {
  return useQuery({ queryKey: ['access', 'permission-catalog'], queryFn: accessPermissionCatalogApi.get, staleTime: 5 * 60_000 })
}

// ── Invitations ──────────────────────────────────────────────────────────────
export function useInvitations() {
  return useQuery({ queryKey: INVITES_KEY, queryFn: accessInvitationsApi.list })
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
