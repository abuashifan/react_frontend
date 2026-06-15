import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorPaymentApi } from '../services/vendorPaymentApi'
import type { VendorPaymentListParams, CreateVendorPaymentPayload } from '../types/vendorPayment.types'

const QK = {
  list: (p: VendorPaymentListParams) => ['purchase', 'payments', p] as const,
  detail: (id: number) => ['purchase', 'payments', id] as const,
  vendorContext: (vendorId: number) => ['purchase', 'payments', 'vendor-context', vendorId] as const,
}

export function useVendorPaymentList(params: VendorPaymentListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => vendorPaymentApi.list(params) })
}

export function useVendorPayment(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => vendorPaymentApi.get(id!),
    enabled: !!id,
  })
}

export function useVendorOpenBills(vendorId?: number | null) {
  return useQuery({
    queryKey: QK.vendorContext(vendorId!),
    queryFn: () => vendorPaymentApi.getVendorContext(vendorId!),
    enabled: !!vendorId,
  })
}

export function useVendorPaymentMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['purchase', 'payments'] })

  return {
    create: useMutation({ mutationFn: (p: CreateVendorPaymentPayload) => vendorPaymentApi.create(p), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => vendorPaymentApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => vendorPaymentApi.void(id, reason), onSuccess: invalidate }),
  }
}
