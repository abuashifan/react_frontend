import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { FiscalYearStatusResponse } from '../types/fiscalYear.types'

export const periodLockApi = {
  status: () =>
    http.get<unknown, ApiResponse<FiscalYearStatusResponse>>('/accounting/period-locks/status'),

  update: (payload: { lock_until: string | null; override_reason?: string }) =>
    http.patch<unknown, ApiResponse<FiscalYearStatusResponse>>('/accounting/period-locks', payload),
}
