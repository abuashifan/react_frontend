import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goodsReceiptApi } from '../services/goodsReceiptApi'
import { fromGoodsReceiptResponse } from '../services/goodsReceiptAdapter'
import type { GoodsReceiptListParams, CreateGoodsReceiptPayload } from '../types/goodsReceipt.types'

const QK = {
  list: (p: GoodsReceiptListParams) => ['purchase', 'goods-receipts', p] as const,
  detail: (id: number) => ['purchase', 'goods-receipts', id] as const,
}

export function useGoodsReceiptList(params: GoodsReceiptListParams) {
  return useQuery({
    queryKey: QK.list(params),
    queryFn: () => goodsReceiptApi.list(params),
    select: (res) => ({ ...res, data: res.data.map(fromGoodsReceiptResponse) }),
  })
}

export function useGoodsReceipt(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => goodsReceiptApi.get(id!),
    enabled: !!id,
    select: (res) => ({ ...res, data: fromGoodsReceiptResponse(res.data) }),
  })
}

export function useGoodsReceiptMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['purchase', 'goods-receipts'] })

  return {
    create: useMutation({ mutationFn: (p: CreateGoodsReceiptPayload) => goodsReceiptApi.create(p), onSuccess: invalidate }),
    createFromPurchaseOrder: useMutation({ mutationFn: (purchaseOrderId: number) => goodsReceiptApi.createFromPurchaseOrder(purchaseOrderId), onSuccess: invalidate }),
    receive: useMutation({ mutationFn: (id: number) => goodsReceiptApi.receive(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => goodsReceiptApi.cancel(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => goodsReceiptApi.void(id, reason), onSuccess: invalidate }),
  }
}
