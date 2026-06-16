import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companySettingsApi, transactionSettingsApi, settingsUsersApi, settingsRolesApi, preferencesApi } from '../services/settingsApi'
import type { CreateUserPayload, UpdateUserPayload } from '../types/settings.types'

// Company settings
export function useCompanySettings() {
  return useQuery({ queryKey: ['settings', 'company'], queryFn: companySettingsApi.get })
}
export function useCompanySettingsMutation() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: companySettingsApi.update, onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings', 'company'] }) })
}

// Transaction settings
export function useTransactionSettings() {
  return useQuery({ queryKey: ['settings', 'transactions'], queryFn: transactionSettingsApi.get })
}
export function useTransactionSettingsMutation() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: transactionSettingsApi.update, onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings', 'transactions'] }) })
}

// Users
export function useSettingsUsers(params?: { page?: number; search?: string }) {
  return useQuery({ queryKey: ['settings', 'users', params], queryFn: () => settingsUsersApi.list({ ...params, per_page: 25 }) })
}
export function useSettingsUserMutations() {
  const qc = useQueryClient()
  const inv = () => void qc.invalidateQueries({ queryKey: ['settings', 'users'] })
  return {
    create: useMutation({ mutationFn: (p: CreateUserPayload) => settingsUsersApi.create(p), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) => settingsUsersApi.update(id, payload), onSuccess: inv }),
    activate: useMutation({ mutationFn: (id: number) => settingsUsersApi.activate(id), onSuccess: inv }),
    deactivate: useMutation({ mutationFn: (id: number) => settingsUsersApi.deactivate(id), onSuccess: inv }),
  }
}

// Roles
export function useSettingsRoles() {
  return useQuery({ queryKey: ['settings', 'roles'], queryFn: settingsRolesApi.list })
}
export function useSettingsRole(id?: number) {
  return useQuery({ queryKey: ['settings', 'roles', id], queryFn: () => settingsRolesApi.get(id!), enabled: !!id })
}
export function useSettingsRoleMutations() {
  const qc = useQueryClient()
  return {
    updatePermissions: useMutation({
      mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) => settingsRolesApi.updatePermissions(id, permissions),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings', 'roles'] }),
    }),
  }
}

// Preferences
export function usePreferences() {
  return useQuery({ queryKey: ['settings', 'preferences'], queryFn: preferencesApi.get })
}
export function usePreferencesMutation() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: preferencesApi.update, onSuccess: () => void qc.invalidateQueries({ queryKey: ['settings', 'preferences'] }) })
}
