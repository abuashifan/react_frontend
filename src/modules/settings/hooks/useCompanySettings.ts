import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companySettingsApi } from '../services/companySettingsApi'
import { usePermission } from '@/hooks/usePermission'
import type {
  CompanyAccountingSettings, CompanyModuleSettings, CompanyTransactionDefaults, CompanyProfilePayload,
} from '../types/settings.types'

export const COMPANY_SETTINGS_KEY = ['settings', 'company']

export function useCompanySettings() {
  return useQuery({ queryKey: COMPANY_SETTINGS_KEY, queryFn: companySettingsApi.get })
}

/**
 * Modul top-bar yang disembunyikan: flag-nya dimatikan DAN belum pernah dipakai.
 * Selama pengaturan belum terbaca (memuat, gagal, tanpa izin) tidak ada yang
 * disembunyikan -- lebih baik menu berlebih daripada fitur yang hilang.
 */
export function useHiddenModules(): Set<string> {
  const { can, permissionsLoaded } = usePermission()
  const { data } = useQuery({
    queryKey: COMPANY_SETTINGS_KEY,
    queryFn: companySettingsApi.get,
    enabled: permissionsLoaded && can('settings.company.view'),
  })
  const settings = data?.data
  const hidden = new Set<string>()
  if (!settings) return hidden
  if (settings.modules?.inventory_enabled === false && settings.modules_in_use?.inventory === false) hidden.add('inventory')
  if (settings.modules?.fixed_asset_enabled === false && settings.modules_in_use?.fixed_asset === false) hidden.add('fixed-assets')
  return hidden
}

export function useCompanyWorkflow() {
  return useQuery({ queryKey: ['settings', 'company', 'workflow'], queryFn: companySettingsApi.getWorkflow })
}

export function useCompanySettingsMutations() {
  const qc = useQueryClient()
  const inv = () => void qc.invalidateQueries({ queryKey: COMPANY_SETTINGS_KEY })
  return {
    updateProfile: useMutation({ mutationFn: (p: CompanyProfilePayload) => companySettingsApi.updateProfile(p), onSuccess: inv }),
    updateAccounting: useMutation({ mutationFn: (p: Partial<CompanyAccountingSettings>) => companySettingsApi.updateAccounting(p), onSuccess: inv }),
    updateModules: useMutation({ mutationFn: (p: Partial<CompanyModuleSettings>) => companySettingsApi.updateModules(p), onSuccess: inv }),
    updateTransactionDefaults: useMutation({ mutationFn: (p: Partial<CompanyTransactionDefaults>) => companySettingsApi.updateTransactionDefaults(p), onSuccess: inv }),
  }
}
