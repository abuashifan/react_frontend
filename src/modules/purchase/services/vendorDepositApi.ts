import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  VendorDeposit,
  VendorDepositListParams,
  CreateVendorDepositPayload,
} from '../types/vendorDeposit.types'

export const vendorDepositApi = {
  list: (params: VendorDepositListParams) =>
    http.get<unknown, PaginatedResponse<VendorDeposit>>('/purchase/vendor-deposits', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}`),

  create: (payload: CreateVendorDepositPayload) =>
    http.post<unknown, ApiResponse<VendorDeposit>>('/purchase/vendor-deposits', payload),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/void`, { reason }),

  refund: (id: number) =>
    http.patch<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/refund`),

  allocateToBill: (id: number, billId: number, amount: number) =>
    http.post<unknown, ApiResponse<VendorDeposit>>(`/purchase/vendor-deposits/${id}/allocate-to-bill/${billId}`, { amount }),
}
