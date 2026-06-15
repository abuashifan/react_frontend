import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  StockOpname,
  StockOpnameListParams,
  CreateStockOpnamePayload,
} from '../types/stockOpname.types'

export const stockOpnameApi = {
  list: (params: StockOpnameListParams) =>
    http.get<unknown, PaginatedResponse<StockOpname>>('/inventory/stock-opnames', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<StockOpname>>(`/inventory/stock-opnames/${id}`),

  create: (payload: CreateStockOpnamePayload) =>
    http.post<unknown, ApiResponse<StockOpname>>('/inventory/stock-opnames', payload),

  generateLines: (id: number) =>
    http.post<unknown, ApiResponse<StockOpname>>(`/inventory/stock-opnames/${id}/generate-lines`),

  updateLine: (id: number, lineId: number, physical_quantity: number, reason?: string) =>
    http.patch<unknown, ApiResponse<StockOpname>>(`/inventory/stock-opnames/${id}/lines/${lineId}`, { physical_quantity, reason }),

  markCounted: (id: number) =>
    http.patch<unknown, ApiResponse<StockOpname>>(`/inventory/stock-opnames/${id}/counted`),

  finalize: (id: number) =>
    http.patch<unknown, ApiResponse<StockOpname>>(`/inventory/stock-opnames/${id}/finalize`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<StockOpname>>(`/inventory/stock-opnames/${id}/void`, { reason }),
}
