import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type {
  SalesOrder,
  SalesOrderListParams,
  CreateSalesOrderPayload,
  UpdateSalesOrderPayload,
} from '../types/salesOrder.types'

export const salesOrderApi = {
  list: (params: SalesOrderListParams) =>
    http.get<unknown, PaginatedResponse<SalesOrder>>('/sales/orders', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesOrder>>(`/sales/orders/${id}`),

  create: (payload: CreateSalesOrderPayload) =>
    http.post<unknown, ApiResponse<SalesOrder>>('/sales/orders', payload),

  createFromQuotation: (quotationId: number) =>
    http.post<unknown, ApiResponse<SalesOrder>>(`/sales/orders/from-quotation/${quotationId}`),

  update: (id: number, payload: UpdateSalesOrderPayload) =>
    http.patch<unknown, ApiResponse<SalesOrder>>(`/sales/orders/${id}`, payload),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesOrder>>(`/sales/orders/${id}/approve`),

  confirm: (id: number) =>
    http.patch<unknown, ApiResponse<SalesOrder>>(`/sales/orders/${id}/confirm`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<SalesOrder>>(`/sales/orders/${id}/cancel`),

  close: (id: number) =>
    http.patch<unknown, ApiResponse<SalesOrder>>(`/sales/orders/${id}/close`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<SalesOrder>>('/sales/orders', {
      params: { search: query, per_page: 10, status: 'confirmed' },
    })
    return res.data.map((so) => ({ value: so.id, label: so.number, sublabel: so.customer?.name }))
  },
}
