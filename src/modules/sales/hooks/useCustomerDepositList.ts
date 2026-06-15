import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerDepositApi } from '../services/customerDepositApi'
import type { CustomerDepositListParams, CreateCustomerDepositPayload, AllocateDepositPayload } from '../types/customerDeposit.types'

const QK = {
  list: (p: CustomerDepositListParams) => ['sales', 'customer-deposits', p] as const,
  detail: (id: number) => ['sales', 'customer-deposits', id] as const,
}

export function useCustomerDepositList(params: CustomerDepositListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => customerDepositApi.list(params) })
}

export function useCustomerDeposit(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => customerDepositApi.get(id!),
    enabled: !!id,
  })
}

export function useCustomerDepositMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'customer-deposits'] })

  return {
    create: useMutation({ mutationFn: (p: CreateCustomerDepositPayload) => customerDepositApi.create(p), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => customerDepositApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => customerDepositApi.void(id, reason), onSuccess: invalidate }),
    refund: useMutation({ mutationFn: (id: number) => customerDepositApi.refund(id), onSuccess: invalidate }),
    allocate: useMutation({
      mutationFn: ({ depositId, invoiceId, payload }: { depositId: number; invoiceId: number; payload: AllocateDepositPayload }) =>
        customerDepositApi.allocateToInvoice(depositId, invoiceId, payload),
      onSuccess: invalidate,
    }),
  }
}
