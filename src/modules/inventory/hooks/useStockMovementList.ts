import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockMovementApi } from '../services/stockMovementApi'
import type { StockMovementListParams, CreateStockMovementPayload } from '../types/stockMovement.types'

const QK = {
  list: (p: StockMovementListParams) => ['inventory', 'stock-movements', p] as const,
  detail: (id: number) => ['inventory', 'stock-movements', id] as const,
}

export function useStockMovementList(params: StockMovementListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => stockMovementApi.list(params) })
}

export function useStockMovement(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => stockMovementApi.get(id!),
    enabled: !!id,
  })
}

export function useStockMovementMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['inventory', 'stock-movements'] })

  return {
    create: useMutation({ mutationFn: (p: CreateStockMovementPayload) => stockMovementApi.create(p), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => stockMovementApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => stockMovementApi.void(id, reason), onSuccess: invalidate }),
  }
}
