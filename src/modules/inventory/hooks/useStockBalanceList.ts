import { useQuery } from '@tanstack/react-query'
import { stockBalanceApi } from '../services/stockBalanceApi'
import type { StockBalanceListParams } from '../types/stockBalance.types'

const QK = {
  list: (p: StockBalanceListParams) => ['inventory', 'stock-balances', p] as const,
  detail: (productId: number, warehouseId: number) => ['inventory', 'stock-balances', productId, warehouseId] as const,
}

export function useStockBalanceList(params: StockBalanceListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => stockBalanceApi.list(params) })
}

export function useStockBalance(productId?: number, warehouseId?: number) {
  return useQuery({
    queryKey: QK.detail(productId!, warehouseId!),
    queryFn: () => stockBalanceApi.get(productId!, warehouseId!),
    enabled: !!productId && !!warehouseId,
  })
}
