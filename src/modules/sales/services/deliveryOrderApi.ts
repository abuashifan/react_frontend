import { http } from '@/services/http'
import { adaptSalesListRows } from './salesListAdapter'
import { adaptSalesDocument, adaptSalesPayload } from './salesTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  DeliveryOrder,
  DeliveryOrderListParams,
  CreateDeliveryOrderPayload,
  UpdateDeliveryOrderPayload,
} from '../types/deliveryOrder.types'

export const deliveryOrderApi = {
  list: async (params: DeliveryOrderListParams) => {
    const res = await http.get<unknown, PaginatedResponse<DeliveryOrder>>('/sales/delivery-orders', { params })
    return { ...res, data: adaptSalesListRows(res.data, { date: 'delivery_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}`)
    return { ...res, data: adaptSalesDocument<DeliveryOrder>(res.data, { dateFields: ['delivery_date'] }) }
  },

  create: (payload: CreateDeliveryOrderPayload) =>
    http.post<unknown, ApiResponse<DeliveryOrder>>('/sales/delivery-orders', adaptSalesPayload(payload, { dateField: 'delivery_date', sourceType: 'sales_order', sourceIdField: 'sales_order_id' })),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/from-sales-order/${salesOrderId}`),

  update: (id: number, payload: UpdateDeliveryOrderPayload) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}`, adaptSalesPayload(payload, { dateField: 'delivery_date', sourceType: 'sales_order', sourceIdField: 'sales_order_id' })),

  ready: (id: number) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/ready`),

  ship: (id: number) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/ship`),

  deliver: (id: number) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/deliver`),

  cancel: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/cancel`, { reason }),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/void`, { reason }),
}
