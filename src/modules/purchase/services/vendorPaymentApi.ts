import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  VendorPayment,
  VendorPaymentListParams,
  CreateVendorPaymentPayload,
  VendorContext,
} from '../types/vendorPayment.types'

export const vendorPaymentApi = {
  list: (params: VendorPaymentListParams) =>
    http.get<unknown, PaginatedResponse<VendorPayment>>('/purchase/payments', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}`),

  create: (payload: CreateVendorPaymentPayload) =>
    http.post<unknown, ApiResponse<VendorPayment>>('/purchase/payments', payload),

  getVendorContext: (vendorId: number) =>
    http.get<unknown, ApiResponse<VendorContext>>('/purchase/payments/vendor-context', { params: { vendor_id: vendorId } }),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}/void`, { reason }),
}
