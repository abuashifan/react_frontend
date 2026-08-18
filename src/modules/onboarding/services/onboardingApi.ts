import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { CoaTemplateAccountInput, CoaTemplateDef, SetupStatus } from '../types/setup.types'

interface AccountSearchResult {
  id: number
  account_code: string
  account_name: string
}

/** Bentuk respons canonical `/master-data/account-mappings` (lihat AccountMappingStorageService::list). */
export interface OnboardingAccountMapping {
  mapping_key: string
  module: string
  label: string | null
  account_id: number | null
  is_required: boolean
  account_code: string | null
  account_name: string | null
  account_types: string[]
}

/**
 * Setup wizard — source of truth backend ada di `/setup/*`
 * (app/Modules/Setup/Routes/api.php). `finalize` melakukan `validateAll`
 * secara internal, jadi penyelesaian wizard cukup memanggil `finalize`.
 */
export const setupApi = {
  getStatus: () => http.get<unknown, ApiResponse<SetupStatus>>('/setup/status'),
  getSteps: () => http.get<unknown, ApiResponse<SetupStatus>>('/setup/steps'),
  updateCurrentStep: (step: string, openingDate?: string) =>
    http.patch<unknown, ApiResponse<Record<string, unknown>>>('/setup/current-step', { current_step: step, opening_date: openingDate }),
  validateStep: (step: string, data?: { opening_date?: string; confirm_no_opening_fixed_assets?: boolean; confirm_opening_balance_skipped?: boolean }) =>
    http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/validate-step', { step, ...data }),
  validateAll: () => http.post<unknown, ApiResponse<{ valid: boolean; results: Record<string, unknown> }>>('/setup/validate-all'),
  getOpeningBalancePreview: () => http.get<unknown, ApiResponse<Record<string, unknown>>>('/setup/opening-balance/preview'),
  finalize: () => http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/finalize'),
  reopen: (reason: string) => http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/reopen', { reason }),
  listCoaTemplates: () => http.get<unknown, ApiResponse<CoaTemplateDef[]>>('/setup/coa-templates'),
  applyCoaTemplate: (payload: { template_id: string; accounts: CoaTemplateAccountInput[] }) =>
    http.post<unknown, ApiResponse<unknown>>('/setup/coa-templates/apply', payload),
}

export const onboardingApi = {
  searchAccounts: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<AccountSearchResult>>(
      '/master-data/chart-of-accounts',
      { params: { search: query, per_page: 10 } },
    )
    return res.data.map((a) => ({ value: a.id, label: a.account_name, sublabel: a.account_code }))
  },

  listAccountMappings: async (): Promise<OnboardingAccountMapping[]> => {
    const res = await http.get<unknown, ApiResponse<OnboardingAccountMapping[]>>(
      '/master-data/account-mappings',
    )
    return res.data
  },

  updateAccountMapping: (key: string, accountId: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/account-mappings/${key}`, { account_id: accountId }),
}
