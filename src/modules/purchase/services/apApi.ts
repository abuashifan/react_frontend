import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  ApVendorSummary,
  ApAgingRow,
  ApReconciliationRow,
  ApLedgerResponse,
  BillLedgerResponse,
} from '../types/ap.types'

export const apApi = {
  vendorSummary: () =>
    http.get<unknown, ApiResponse<ApVendorSummary[]>>('/purchase/ap/vendor-summary'),

  vendorLedger: (vendorId: number) =>
    http.get<unknown, ApiResponse<ApLedgerResponse>>(`/purchase/ap/vendors/${vendorId}/ledger`),

  billLedger: (billId: number) =>
    http.get<unknown, ApiResponse<BillLedgerResponse>>(`/purchase/ap/bills/${billId}/ledger`),

  openBills: (params?: { vendor_id?: number }) =>
    http.get<unknown, PaginatedResponse<{ id: number; number: string; balance_due: number }>>('/purchase/ap/open-bills', { params }),

  aging: () =>
    http.get<unknown, ApiResponse<ApAgingRow[]>>('/purchase/ap/aging'),

  reconciliation: () =>
    http.get<unknown, ApiResponse<ApReconciliationRow[]>>('/purchase/ap/reconciliation'),
}
