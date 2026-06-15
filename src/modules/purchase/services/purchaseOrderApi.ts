import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  PurchaseOrder,
  PurchaseOrderListParams,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from '../types/purchaseOrder.types'

export const purchaseOrderApi = {
  list: (params: PurchaseOrderListParams) =>
    http.get<unknown, PaginatedResponse<PurchaseOrder>>('/purchase/orders', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}`),

  create: (payload: CreatePurchaseOrderPayload) =>
    http.post<unknown, ApiResponse<PurchaseOrder>>('/purchase/orders', payload),

  createFromRequest: (purchaseRequestId: number) =>
    http.post<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/from-request/${purchaseRequestId}`),

  update: (id: number, payload: UpdatePurchaseOrderPayload) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}`, payload),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/approve`),

  confirm: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/confirm`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/cancel`),

  close: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/close`),
}
