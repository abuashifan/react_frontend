import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  PurchaseOrder,
  RawPurchaseOrder,
  PurchaseOrderListParams,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from '../types/purchaseOrder.types'

export const purchaseOrderApi = {
  list: (params: PurchaseOrderListParams) =>
    http.get<unknown, PaginatedResponse<RawPurchaseOrder>>('/purchase/orders', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/purchase/orders/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<RawPurchaseOrder>>(`/purchase/orders/${id}`),

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
