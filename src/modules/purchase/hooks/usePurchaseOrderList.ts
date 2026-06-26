import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseOrderApi } from '../services/purchaseOrderApi'
import { fromPurchaseOrderResponse } from '../services/purchaseOrderAdapter'
import type { PurchaseOrderListParams, CreatePurchaseOrderPayload, UpdatePurchaseOrderPayload } from '../types/purchaseOrder.types'

const QK = {
  list: (p: PurchaseOrderListParams) => ['purchase', 'orders', p] as const,
  detail: (id: number) => ['purchase', 'orders', id] as const,
}

export function usePurchaseOrderList(params: PurchaseOrderListParams) {
  return useQuery({
    queryKey: QK.list(params),
    queryFn: () => purchaseOrderApi.list(params),
    select: (res) => ({ ...res, data: res.data.map(fromPurchaseOrderResponse) }),
  })
}

export function usePurchaseOrder(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => purchaseOrderApi.get(id!),
    enabled: !!id,
    select: (res) => ({ ...res, data: fromPurchaseOrderResponse(res.data) }),
  })
}

export function usePurchaseOrderMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['purchase', 'orders'] })

  return {
    create: useMutation({ mutationFn: (p: CreatePurchaseOrderPayload) => purchaseOrderApi.create(p), onSuccess: invalidate }),
    createFromRequest: useMutation({ mutationFn: (purchaseRequestId: number) => purchaseOrderApi.createFromRequest(purchaseRequestId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdatePurchaseOrderPayload }) => purchaseOrderApi.update(id, payload), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => purchaseOrderApi.approve(id), onSuccess: invalidate }),
    confirm: useMutation({ mutationFn: (id: number) => purchaseOrderApi.confirm(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => purchaseOrderApi.cancel(id), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (id: number) => purchaseOrderApi.close(id), onSuccess: invalidate }),
  }
}
