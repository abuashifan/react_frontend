import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorDepositApi } from '../services/vendorDepositApi'
import { fromVendorDepositResponse } from '../services/vendorDepositAdapter'
import type { VendorDepositListParams, CreateVendorDepositPayload } from '../types/vendorDeposit.types'

const QK = {
  list: (p: VendorDepositListParams) => ['purchase', 'vendor-deposits', p] as const,
  detail: (id: number) => ['purchase', 'vendor-deposits', id] as const,
}

export function useVendorDepositList(params: VendorDepositListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => vendorDepositApi.list(params), select: (res) => ({ ...res, data: res.data.map(fromVendorDepositResponse) }) })
}

export function useVendorDeposit(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => vendorDepositApi.get(id!),
    enabled: !!id,
    select: (res) => ({ ...res, data: fromVendorDepositResponse(res.data) }),
  })
}

export function useVendorDepositMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['purchase', 'vendor-deposits'] })

  return {
    create: useMutation({ mutationFn: (p: CreateVendorDepositPayload) => vendorDepositApi.create(p), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => vendorDepositApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => vendorDepositApi.void(id, reason), onSuccess: invalidate }),
    refund: useMutation({ mutationFn: (id: number) => vendorDepositApi.refund(id), onSuccess: invalidate }),
  }
}
