import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { FiscalYearStatusResponse } from '../types/fiscalYear.types'

export const fiscalYearApi = {
  status: () =>
    http.get<unknown, ApiResponse<FiscalYearStatusResponse>>('/accounting/fiscal-year/status'),

  preview: (id: number) =>
    http.patch<unknown, ApiResponse<Record<string, unknown>>>(`/accounting/fiscal-years/${id}/closing-preview`),

  checklist: (id: number) =>
    http.patch<unknown, ApiResponse<Record<string, unknown>>>(`/accounting/fiscal-years/${id}/closing-checklist`),

  close: (id: number, payload: { closing_entry_date?: string; retained_earnings_account_id?: number }) =>
    http.patch<unknown, ApiResponse<Record<string, unknown>>>(`/accounting/fiscal-years/${id}/close`, payload),

  reopen: (id: number, payload: { reopen_reason: string }) =>
    http.patch<unknown, ApiResponse<Record<string, unknown>>>(`/accounting/fiscal-years/${id}/reopen`, payload),
}
