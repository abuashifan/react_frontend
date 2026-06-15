import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockOpnameApi } from '../services/stockOpnameApi'
import type { StockOpnameListParams, CreateStockOpnamePayload } from '../types/stockOpname.types'

const QK = {
  list: (p: StockOpnameListParams) => ['inventory', 'stock-opnames', p] as const,
  detail: (id: number) => ['inventory', 'stock-opnames', id] as const,
}

export function useStockOpnameList(params: StockOpnameListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => stockOpnameApi.list(params) })
}

export function useStockOpname(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => stockOpnameApi.get(id!),
    enabled: !!id,
  })
}

export function useStockOpnameMutations() {
  const qc = useQueryClient()
  const invalidate = (id?: number) => {
    void qc.invalidateQueries({ queryKey: ['inventory', 'stock-opnames'] })
    if (id) void qc.invalidateQueries({ queryKey: QK.detail(id) })
  }

  return {
    create: useMutation({ mutationFn: (p: CreateStockOpnamePayload) => stockOpnameApi.create(p), onSuccess: () => invalidate() }),
    generateLines: useMutation({ mutationFn: (id: number) => stockOpnameApi.generateLines(id), onSuccess: (_, id) => invalidate(id) }),
    updateLine: useMutation({
      mutationFn: ({ id, lineId, physical_quantity, reason }: { id: number; lineId: number; physical_quantity: number; reason?: string }) =>
        stockOpnameApi.updateLine(id, lineId, physical_quantity, reason),
      onSuccess: (_, { id }) => invalidate(id),
    }),
    markCounted: useMutation({ mutationFn: (id: number) => stockOpnameApi.markCounted(id), onSuccess: (_, id) => invalidate(id) }),
    finalize: useMutation({ mutationFn: (id: number) => stockOpnameApi.finalize(id), onSuccess: (_, id) => invalidate(id) }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => stockOpnameApi.void(id, reason), onSuccess: (_, { id }) => invalidate(id) }),
  }
}
