import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import { adaptApiResponse, adaptApAgingResponse, adaptApReconciliationSummary, adaptApVendorSummaryResponse, adaptBillLedgerResponse, adaptVendorLedgerResponse } from './apAdapters'

export const apApi = {
  vendorSummary: () =>
    http.get<unknown, ApiResponse<unknown>>('/purchase/ap/vendor-summary').then((response) => adaptApiResponse(response, adaptApVendorSummaryResponse)),

  vendorLedger: (vendorId: number) =>
    http
      .get<unknown, ApiResponse<unknown>>(`/purchase/ap/vendors/${vendorId}/ledger`)
      .then((response) => adaptApiResponse(response, adaptVendorLedgerResponse)),

  billLedger: (billId: number) =>
    http
      .get<unknown, ApiResponse<unknown>>(`/purchase/ap/bills/${billId}/ledger`)
      .then((response) => adaptApiResponse(response, adaptBillLedgerResponse)),

  openBills: (params?: { vendor_id?: number }) =>
    http.get<unknown, PaginatedResponse<{ id: number; number: string; balance_due: number }>>('/purchase/ap/open-bills', { params }),

  aging: () =>
    http
      .get<unknown, ApiResponse<unknown>>('/purchase/ap/aging')
      .then((response) => adaptApiResponse(response, adaptApAgingResponse)),

  reconciliation: () =>
    http
      .get<unknown, ApiResponse<unknown>>('/purchase/ap/reconciliation')
      .then((response) => adaptApiResponse(response, adaptApReconciliationSummary)),
}
