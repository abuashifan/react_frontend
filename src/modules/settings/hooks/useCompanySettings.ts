import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companySettingsApi } from '../services/companySettingsApi'
import type {
  CompanyAccountingSettings, CompanyModuleSettings, CompanyTransactionDefaults,
} from '../types/settings.types'

const COMPANY_KEY = ['settings', 'company']

export function useCompanySettings() {
  return useQuery({ queryKey: COMPANY_KEY, queryFn: companySettingsApi.get })
}

export function useCompanyWorkflow() {
  return useQuery({ queryKey: ['settings', 'company', 'workflow'], queryFn: companySettingsApi.getWorkflow })
}

export function useCompanySettingsMutations() {
  const qc = useQueryClient()
  const inv = () => void qc.invalidateQueries({ queryKey: COMPANY_KEY })
  return {
    updateAccounting: useMutation({ mutationFn: (p: Partial<CompanyAccountingSettings>) => companySettingsApi.updateAccounting(p), onSuccess: inv }),
    updateModules: useMutation({ mutationFn: (p: Partial<CompanyModuleSettings>) => companySettingsApi.updateModules(p), onSuccess: inv }),
    updateTransactionDefaults: useMutation({ mutationFn: (p: Partial<CompanyTransactionDefaults>) => companySettingsApi.updateTransactionDefaults(p), onSuccess: inv }),
  }
}
