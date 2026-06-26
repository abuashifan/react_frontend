import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseRequestApi } from '../services/purchaseRequestApi'
import { fromPurchaseRequestResponse } from '../services/purchaseRequestAdapter'
import type { PurchaseRequestListParams, CreatePurchaseRequestPayload, UpdatePurchaseRequestPayload } from '../types/purchaseRequest.types'

const QK = {
  list: (p: PurchaseRequestListParams) => ['purchase', 'requests', p] as const,
  detail: (id: number) => ['purchase', 'requests', id] as const,
}

export function usePurchaseRequestList(params: PurchaseRequestListParams) {
  return useQuery({
    queryKey: QK.list(params),
    queryFn: () => purchaseRequestApi.list(params),
    select: (res) => ({ ...res, data: res.data.map(fromPurchaseRequestResponse) }),
  })
}

export function usePurchaseRequest(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => purchaseRequestApi.get(id!),
    enabled: !!id,
    select: (res) => ({ ...res, data: fromPurchaseRequestResponse(res.data) }),
  })
}

export function usePurchaseRequestMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['purchase', 'requests'] })

  return {
    create: useMutation({ mutationFn: (p: CreatePurchaseRequestPayload) => purchaseRequestApi.create(p), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdatePurchaseRequestPayload }) => purchaseRequestApi.update(id, payload), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (id: number) => purchaseRequestApi.submit(id), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => purchaseRequestApi.approve(id), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (id: number) => purchaseRequestApi.reject(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => purchaseRequestApi.cancel(id), onSuccess: invalidate }),
  }
}
