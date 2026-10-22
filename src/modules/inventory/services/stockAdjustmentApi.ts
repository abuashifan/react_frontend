import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  StockAdjustment,
  StockAdjustmentListParams,
  CreateStockAdjustmentPayload,
  UpdateStockAdjustmentPayload,
} from '../types/stockAdjustment.types'

export const stockAdjustmentApi = {
  list: (params: StockAdjustmentListParams) =>
    http.get<unknown, PaginatedResponse<StockAdjustment>>('/inventory/stock-adjustments', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/inventory/stock-adjustments/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<StockAdjustment>>(`/inventory/stock-adjustments/${id}`),

  create: (payload: CreateStockAdjustmentPayload) =>
    http.post<unknown, ApiResponse<StockAdjustment>>('/inventory/stock-adjustments', payload),

  update: (id: number, payload: UpdateStockAdjustmentPayload) =>
    http.patch<unknown, ApiResponse<StockAdjustment>>(`/inventory/stock-adjustments/${id}`, payload),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<StockAdjustment>>(`/inventory/stock-adjustments/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<StockAdjustment>>(`/inventory/stock-adjustments/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<StockAdjustment>>(`/inventory/stock-adjustments/${id}/void`, { reason }),

  /** Hapus dokumen (mode lock/open). Tanpa efek dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/inventory/stock-adjustments/${id}`, { data: reason ? { reason } : {} }),
}
