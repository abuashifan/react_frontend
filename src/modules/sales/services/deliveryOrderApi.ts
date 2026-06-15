import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  DeliveryOrder,
  DeliveryOrderListParams,
  CreateDeliveryOrderPayload,
  UpdateDeliveryOrderPayload,
} from '../types/deliveryOrder.types'

export const deliveryOrderApi = {
  list: (params: DeliveryOrderListParams) =>
    http.get<unknown, PaginatedResponse<DeliveryOrder>>('/sales/delivery-orders', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}`),

  create: (payload: CreateDeliveryOrderPayload) =>
    http.post<unknown, ApiResponse<DeliveryOrder>>('/sales/delivery-orders', payload),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/from-sales-order/${salesOrderId}`),

  update: (id: number, payload: UpdateDeliveryOrderPayload) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}`, payload),

  ready: (id: number) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/ready`),

  ship: (id: number) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/ship`),

  deliver: (id: number) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/deliver`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/cancel`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}/void`, { reason }),
}
