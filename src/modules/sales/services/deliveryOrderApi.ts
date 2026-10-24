import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  DeliveryOrder,
  DeliveryOrderListParams,
  CreateDeliveryOrderPayload,
  UpdateDeliveryOrderPayload,
} from '../types/deliveryOrder.types'


/** Form memakai `date`; backend mewajibkan `delivery_date` (tanpa ini simpan ditolak 422). */
function toPayload<T extends { date?: string }>({ date, ...rest }: T) {
  return date === undefined ? rest : { ...rest, delivery_date: date }
}
export const deliveryOrderApi = {
  list: (params: DeliveryOrderListParams) =>
    http.get<unknown, PaginatedResponse<DeliveryOrder>>('/sales/delivery-orders', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/sales/delivery-orders/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}`),

  create: (payload: CreateDeliveryOrderPayload) =>
    http.post<unknown, ApiResponse<DeliveryOrder>>('/sales/delivery-orders', toPayload(payload)),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/from-sales-order/${salesOrderId}`),

  update: (id: number, payload: UpdateDeliveryOrderPayload) =>
    http.patch<unknown, ApiResponse<DeliveryOrder>>(`/sales/delivery-orders/${id}`, toPayload(payload)),

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

  /** Hapus dokumen (mode lock/open). Tanpa efek dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/sales/delivery-orders/${id}`, { data: reason ? { reason } : {} }),
}
