import { http } from '@/services/http'
import { adaptPurchaseListRows } from './purchaseListAdapter'
import { adaptPurchaseDocument, adaptPurchasePayload } from './purchaseTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  VendorPayment,
  VendorPaymentListParams,
  CreateVendorPaymentPayload,
  VendorContext,
} from '../types/vendorPayment.types'

const DATE_OPTS = { dateField: 'payment_date' }

export const vendorPaymentApi = {
  list: async (params: VendorPaymentListParams) => {
    const res = await http.get<unknown, PaginatedResponse<VendorPayment>>('/purchase/payments', { params })
    return { ...res, data: adaptPurchaseListRows(res.data, { date: 'payment_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}`)
    return { ...res, data: adaptPurchaseDocument<VendorPayment>(res.data, DATE_OPTS) }
  },

  create: (payload: CreateVendorPaymentPayload) =>
    http.post<unknown, ApiResponse<VendorPayment>>('/purchase/payments', adaptPurchasePayload(payload, DATE_OPTS)),

  getVendorContext: (vendorId: number) =>
    http.get<unknown, ApiResponse<VendorContext>>('/purchase/payments/vendor-context', { params: { vendor_id: vendorId } }),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}/void`, { reason }),
}
