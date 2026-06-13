import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Company } from '@/types/auth.types'
import type { SelectOption } from '@/types/common.types'

interface AccountSearchResult {
  id: number
  code: string
  name: string
}

export const onboardingApi = {
  updateCompanyInfo: (companyId: number, data: {
    name: string
    address?: string
    npwp?: string
    fiscal_year_start: string
    currency: string
  }) =>
    http.patch<ApiResponse<Company>>(`/companies/${companyId}`, data),

  applyCoaTemplate: (companyId: number, template: string) =>
    http.post<ApiResponse<void>>(`/companies/${companyId}/coa-template`, { template }),

  searchAccounts: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<PaginatedResponse<AccountSearchResult>>(
      '/master-data/chart-of-accounts',
      { params: { search: query, per_page: 10 } },
    )
    return res.data.map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))
  },

  updateAccountMapping: (key: string, accountId: number) =>
    http.patch<ApiResponse<void>>(`/master-data/account-mappings/${key}`, { account_id: accountId }),

  createWarehouse: (data: { name: string; address?: string }) =>
    http.post<ApiResponse<{ id: number; name: string }>>('/master-data/warehouses', data),

  createUnit: (data: { name: string; symbol: string }) =>
    http.post<ApiResponse<{ id: number; name: string }>>('/master-data/units', data),

  createPaymentTerm: (data: { name: string; days: number }) =>
    http.post<ApiResponse<{ id: number; name: string }>>('/master-data/payment-terms', data),

  saveOpeningBalance: (data: { opening_date: string; entries: Array<{ account_id: number; debit: number; credit: number }> }) =>
    http.post<ApiResponse<void>>('/accounting/opening-balances', data),

  completeOnboarding: (companyId: number) =>
    http.patch<ApiResponse<void>>(`/companies/${companyId}/complete-onboarding`),
}
