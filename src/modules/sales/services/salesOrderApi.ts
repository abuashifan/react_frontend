import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type {
  SalesOrder,
  SalesOrderListParams,
  CreateSalesOrderPayload,
  UpdateSalesOrderPayload,
} from '../types/salesOrder.types'

/**
 * Petakan `order_number` backend ke UI `number`.
 * Sales Order punya `order_number` DAN `quotation_number`; alias global di
 * `http.ts` bisa salah memilih `quotation_number`, jadi di sini kita override
 * eksplisit dengan `order_number` (spec-33 / GAP-08).
 */
function toSalesOrder(row: SalesOrder): SalesOrder {
  return row.order_number ? { ...row, number: row.order_number } : row
}

export const salesOrderApi = {
  list: async (params: SalesOrderListParams) => {
    const res = await http.get<unknown, PaginatedResponse<SalesOrder>>('/sales/orders', { params })
    return { ...res, data: res.data.map(toSalesOrder) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<SalesOrder>>(`/sales/orders/${id}`)
    return { ...res, data: toSalesOrder(res.data) }
  },

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
    return res.data.map((so) => ({ value: so.id, label: so.order_number ?? so.number, sublabel: so.customer?.name }))
  },
}
