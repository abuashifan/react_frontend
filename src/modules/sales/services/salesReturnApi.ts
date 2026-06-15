import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  SalesReturn,
  SalesReturnListParams,
  CreateSalesReturnPayload,
  UpdateSalesReturnPayload,
} from '../types/salesReturn.types'

export const salesReturnApi = {
  list: (params: SalesReturnListParams) =>
    http.get<unknown, PaginatedResponse<SalesReturn>>('/sales/returns', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}`),

  create: (payload: CreateSalesReturnPayload) =>
    http.post<unknown, ApiResponse<SalesReturn>>('/sales/returns', payload),

  createFromInvoice: (invoiceId: number) =>
    http.post<unknown, ApiResponse<SalesReturn>>(`/sales/returns/from-invoice/${invoiceId}`),

  createFromDeliveryOrder: (doId: number) =>
    http.post<unknown, ApiResponse<SalesReturn>>(`/sales/returns/from-delivery-order/${doId}`),

  update: (id: number, payload: UpdateSalesReturnPayload) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}`, payload),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/void`, { reason }),
}
