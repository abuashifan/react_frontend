import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  StockMovement,
  StockMovementListParams,
  CreateStockMovementPayload,
} from '../types/stockMovement.types'

export const stockMovementApi = {
  list: (params: StockMovementListParams) =>
    http.get<unknown, PaginatedResponse<StockMovement>>('/inventory/stock-movements', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/inventory/stock-movements/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<StockMovement>>(`/inventory/stock-movements/${id}`),

  create: (payload: CreateStockMovementPayload) =>
    http.post<unknown, ApiResponse<StockMovement>>('/inventory/stock-movements', payload),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<StockMovement>>(`/inventory/stock-movements/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<StockMovement>>(`/inventory/stock-movements/${id}/void`, { reason }),
}
