import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorBillApi } from '../services/vendorBillApi'
import type { VendorBillListParams, CreateVendorBillPayload, UpdateVendorBillPayload } from '../types/vendorBill.types'

const QK = {
  list: (p: VendorBillListParams) => ['purchase', 'bills', p] as const,
  detail: (id: number) => ['purchase', 'bills', id] as const,
}

export function useVendorBillList(params: VendorBillListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => vendorBillApi.list(params) })
}

export function useVendorBill(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => vendorBillApi.get(id!),
    enabled: !!id,
  })
}

export function useVendorBillMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['purchase', 'bills'] })

  return {
    create: useMutation({ mutationFn: (p: CreateVendorBillPayload) => vendorBillApi.create(p), onSuccess: invalidate }),
    createFromPurchaseOrder: useMutation({ mutationFn: (purchaseOrderId: number) => vendorBillApi.createFromPurchaseOrder(purchaseOrderId), onSuccess: invalidate }),
    createFromGoodsReceipt: useMutation({ mutationFn: (goodsReceiptId: number) => vendorBillApi.createFromGoodsReceipt(goodsReceiptId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateVendorBillPayload }) => vendorBillApi.update(id, payload), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => vendorBillApi.approve(id), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => vendorBillApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => vendorBillApi.void(id, reason), onSuccess: invalidate }),
  }
}
