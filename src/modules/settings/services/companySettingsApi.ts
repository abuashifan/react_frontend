import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  CompanySettingsResponse, CompanyWorkflowSettings,
  CompanyAccountingSettings, CompanyModuleSettings, CompanyTransactionDefaults,
  CompanyProfile, CompanyProfilePayload,
} from '../types/settings.types'

// Backend: app/Modules/Settings/Routes/api.php
export const companySettingsApi = {
  get: () => http.get<unknown, ApiResponse<CompanySettingsResponse>>('/settings/company'),
  getWorkflow: () => http.get<unknown, ApiResponse<CompanyWorkflowSettings>>('/settings/company/workflow'),
  updateProfile: (payload: CompanyProfilePayload) =>
    http.patch<unknown, ApiResponse<{ profile: CompanyProfile }>>('/settings/company/profile', payload),
  updateAccounting: (payload: Partial<CompanyAccountingSettings>) =>
    http.patch<unknown, ApiResponse<{ accounting: CompanyAccountingSettings }>>('/settings/company/accounting', payload),
  updateModules: (payload: Partial<CompanyModuleSettings>) =>
    http.patch<unknown, ApiResponse<{ modules: CompanyModuleSettings }>>('/settings/company/modules', payload),
  updateTransactionDefaults: (payload: Partial<CompanyTransactionDefaults>) =>
    http.patch<unknown, ApiResponse<{ transaction_defaults: CompanyTransactionDefaults }>>('/settings/company/transaction-defaults', payload),
}
