import { http } from '@/services/http'
import { adaptPurchaseListRows } from './purchaseListAdapter'
import { adaptPurchaseDocument, adaptPurchasePayload } from './purchaseTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  VendorDeposit,
  VendorDepositListParams,
  CreateVendorDepositPayload,
} from '../types/vendorDeposit.types'

const DATE_OPTS = { dateField: 'deposit_date' }

export const vendorDepositApi = {
  list: async (params: VendorDepositListParams) => {
    const res = await http.get<unknown, PaginatedResponse<VendorDeposit>>('/purchase/vendor-deposits', { params })
    return { ...res, data: adaptPurchaseListRows(res.data, { date: 'deposit_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}`)
    return { ...res, data: adaptPurchaseDocument<VendorDeposit>(res.data, DATE_OPTS) }
  },

  create: (payload: CreateVendorDepositPayload) =>
    http.post<unknown, ApiResponse<VendorDeposit>>('/purchase/vendor-deposits', adaptPurchasePayload(payload, DATE_OPTS)),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/void`, { reason }),

  refund: (id: number) =>
    http.patch<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/refund`),

  allocateToBill: (id: number, billId: number, amount: number) =>
    http.post<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/allocate-to-bill/${billId}`, { amount }),
}
