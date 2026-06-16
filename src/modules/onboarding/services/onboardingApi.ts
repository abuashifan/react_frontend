import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'

interface AccountSearchResult {
  id: number
  account_code: string
  account_name: string
}

/**
 * Setup wizard — source of truth backend ada di `/setup/*`
 * (app/Modules/Setup/Routes/api.php). `finalize` melakukan `validateAll`
 * secara internal, jadi penyelesaian wizard cukup memanggil `finalize`.
 */
export const setupApi = {
  getStatus: () => http.get<unknown, ApiResponse<Record<string, unknown>>>('/setup/status'),
  getSteps: () => http.get<unknown, ApiResponse<Record<string, unknown>>>('/setup/steps'),
  updateCurrentStep: (step: string, openingDate?: string) =>
    http.patch<unknown, ApiResponse<Record<string, unknown>>>('/setup/current-step', { current_step: step, opening_date: openingDate }),
  validateStep: (step: string, data?: { opening_date?: string; confirm_no_opening_fixed_assets?: boolean }) =>
    http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/validate-step', { step, ...data }),
  validateAll: () => http.post<unknown, ApiResponse<{ valid: boolean; results: Record<string, unknown> }>>('/setup/validate-all'),
  getOpeningBalancePreview: () => http.get<unknown, ApiResponse<Record<string, unknown>>>('/setup/opening-balance/preview'),
  finalize: () => http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/finalize'),
  reopen: (reason: string) => http.post<unknown, ApiResponse<Record<string, unknown>>>('/setup/reopen', { reason }),
}

export const onboardingApi = {
  searchAccounts: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<AccountSearchResult>>(
      '/master-data/chart-of-accounts',
      { params: { search: query, per_page: 10 } },
    )
    return res.data.map((a) => ({ value: a.id, label: a.account_name, sublabel: a.account_code }))
  },

  updateAccountMapping: (key: string, accountId: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/account-mappings/${key}`, { account_id: accountId }),

  createWarehouse: (data: { name: string; address?: string }) =>
    http.post<unknown, ApiResponse<{ id: number; name: string }>>('/master-data/warehouses', data),

  createUnit: (data: { name: string; code: string }) =>
    http.post<unknown, ApiResponse<{ id: number; name: string }>>('/master-data/units', data),

  createPaymentTerm: (data: { name: string; days: number }) =>
    http.post<unknown, ApiResponse<{ id: number; name: string }>>('/master-data/payment-terms', data),
}
