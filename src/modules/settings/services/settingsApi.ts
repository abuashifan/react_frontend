import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CompanySettingsData, TransactionSettings,
  SettingsUser, CreateUserPayload, UpdateUserPayload,
  SettingsRole, UserPreferences,
} from '../types/settings.types'

export const companySettingsApi = {
  get: () => http.get<unknown, ApiResponse<CompanySettingsData>>('/settings/company'),
  update: (payload: Partial<CompanySettingsData>) => http.patch<unknown, ApiResponse<CompanySettingsData>>('/settings/company', payload),
}

export const transactionSettingsApi = {
  get: () => http.get<unknown, ApiResponse<TransactionSettings>>('/settings/transactions'),
  update: (payload: Partial<TransactionSettings>) => http.patch<unknown, ApiResponse<TransactionSettings>>('/settings/transactions', payload),
}

export const settingsUsersApi = {
  list: (params?: { page?: number; per_page?: number; search?: string }) =>
    http.get<unknown, PaginatedResponse<SettingsUser>>('/settings/users', { params }),
  get: (id: number) => http.get<unknown, ApiResponse<SettingsUser>>(`/settings/users/${id}`),
  create: (payload: CreateUserPayload) => http.post<unknown, ApiResponse<SettingsUser>>('/settings/users', payload),
  update: (id: number, payload: UpdateUserPayload) => http.patch<unknown, ApiResponse<SettingsUser>>(`/settings/users/${id}`, payload),
  activate: (id: number) => http.patch<unknown, ApiResponse<SettingsUser>>(`/settings/users/${id}/activate`),
  deactivate: (id: number) => http.patch<unknown, ApiResponse<SettingsUser>>(`/settings/users/${id}/deactivate`),
}

export const settingsRolesApi = {
  list: () => http.get<unknown, ApiResponse<SettingsRole[]>>('/settings/roles'),
  get: (id: number) => http.get<unknown, ApiResponse<SettingsRole>>(`/settings/roles/${id}`),
  updatePermissions: (id: number, permissions: string[]) =>
    http.patch<unknown, ApiResponse<SettingsRole>>(`/settings/roles/${id}/permissions`, { permissions }),
}

export const preferencesApi = {
  get: () => http.get<unknown, ApiResponse<UserPreferences>>('/settings/preferences'),
  update: (payload: Partial<UserPreferences>) => http.patch<unknown, ApiResponse<UserPreferences>>('/settings/preferences', payload),
}
