import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type { OBStatus, OBClosePayload } from '../types/openingBalance.types'

// Backend: app/Modules/OpeningBalance/Routes/api.php
export const openingBalanceApi = {
  status: () => http.get<unknown, ApiResponse<OBStatus>>('/opening-balance/status'),
  setOpeningDate: (openingDate: string) =>
    http.put<unknown, ApiResponse<{ opening_date: string }>>('/opening-balance/opening-date', {
      opening_date: openingDate,
    }),
  closeClearing: (payload: OBClosePayload = {}) =>
    http.post<unknown, ApiResponse<unknown>>('/opening-balance/close-clearing', payload),
  voidJournal: (journalId: number, reason: string) =>
    http.delete<unknown, ApiResponse<OBStatus>>(`/opening-balance/journals/${journalId}`, {
      data: { reason },
    }),
}
