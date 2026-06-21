import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { FiscalYearStatusResponse, FiscalYearClosingPreview } from '../types/fiscalYear.types'

export const fiscalYearApi = {
  status: () =>
    http.get<unknown, ApiResponse<FiscalYearStatusResponse>>('/accounting/fiscal-year/status'),

  // Canonical backend: GET preview/checklist, POST close/reopen.
  preview: (id: number) =>
    http.get<unknown, ApiResponse<FiscalYearClosingPreview>>(`/accounting/fiscal-years/${id}/closing-preview`),

  checklist: (id: number) =>
    http.get<unknown, ApiResponse<Record<string, unknown>>>(`/accounting/fiscal-years/${id}/closing-checklist`),

  close: (id: number, payload: { closing_notes?: string }) =>
    http.post<unknown, ApiResponse<Record<string, unknown>>>(`/accounting/fiscal-years/${id}/close`, payload),

  reopen: (id: number, payload: { reopen_reason: string }) =>
    http.post<unknown, ApiResponse<Record<string, unknown>>>(`/accounting/fiscal-years/${id}/reopen`, payload),
}
