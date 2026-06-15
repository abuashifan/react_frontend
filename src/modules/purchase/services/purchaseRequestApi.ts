import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  PurchaseRequest,
  PurchaseRequestListParams,
  CreatePurchaseRequestPayload,
  UpdatePurchaseRequestPayload,
} from '../types/purchaseRequest.types'

export const purchaseRequestApi = {
  list: (params: PurchaseRequestListParams) =>
    http.get<unknown, PaginatedResponse<PurchaseRequest>>('/purchase/requests', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}`),

  create: (payload: CreatePurchaseRequestPayload) =>
    http.post<unknown, ApiResponse<PurchaseRequest>>('/purchase/requests', payload),

  update: (id: number, payload: UpdatePurchaseRequestPayload) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}`, payload),

  submit: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/submit`),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/approve`),

  reject: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/reject`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/cancel`),
}
