import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { StockBalance, StockBalanceListParams } from '../types/stockBalance.types'

export const stockBalanceApi = {
  list: (params: StockBalanceListParams) =>
    http.get<unknown, PaginatedResponse<StockBalance>>('/inventory/stock-balances', { params }),

  get: (productId: number, warehouseId: number) =>
    http.get<unknown, ApiResponse<StockBalance>>(`/inventory/stock-balances/${productId}/${warehouseId}`),
}
