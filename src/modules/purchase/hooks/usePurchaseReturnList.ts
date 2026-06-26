import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseReturnApi } from '../services/purchaseReturnApi'
import { fromPurchaseReturnResponse } from '../services/purchaseReturnAdapter'
import type { PurchaseReturnListParams, CreatePurchaseReturnPayload } from '../types/purchaseReturn.types'

const QK = {
  list: (p: PurchaseReturnListParams) => ['purchase', 'returns', p] as const,
  detail: (id: number) => ['purchase', 'returns', id] as const,
}

export function usePurchaseReturnList(params: PurchaseReturnListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => purchaseReturnApi.list(params), select: (res) => ({ ...res, data: res.data.map(fromPurchaseReturnResponse) }) })
}

export function usePurchaseReturn(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => purchaseReturnApi.get(id!),
    enabled: !!id,
    select: (res) => ({ ...res, data: fromPurchaseReturnResponse(res.data) }),
  })
}

export function usePurchaseReturnMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['purchase', 'returns'] })

  return {
    create: useMutation({ mutationFn: (p: CreatePurchaseReturnPayload) => purchaseReturnApi.create(p), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => purchaseReturnApi.approve(id), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => purchaseReturnApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => purchaseReturnApi.void(id, reason), onSuccess: invalidate }),
  }
}
