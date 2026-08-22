import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  PurchaseRequest,
  RawPurchaseRequest,
  PurchaseRequestListParams,
  CreatePurchaseRequestPayload,
  UpdatePurchaseRequestPayload,
} from '../types/purchaseRequest.types'

export const purchaseRequestApi = {
  list: (params: PurchaseRequestListParams) =>
    http.get<unknown, PaginatedResponse<RawPurchaseRequest>>('/purchase/requests', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/purchase/requests/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<RawPurchaseRequest>>(`/purchase/requests/${id}`),

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
