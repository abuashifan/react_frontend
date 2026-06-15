import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesReturnApi } from '../services/salesReturnApi'
import type { SalesReturnListParams, CreateSalesReturnPayload, UpdateSalesReturnPayload } from '../types/salesReturn.types'

const QK = {
  list: (p: SalesReturnListParams) => ['sales', 'returns', p] as const,
  detail: (id: number) => ['sales', 'returns', id] as const,
}

export function useSalesReturnList(params: SalesReturnListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => salesReturnApi.list(params) })
}

export function useSalesReturn(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => salesReturnApi.get(id!),
    enabled: !!id,
  })
}

export function useSalesReturnMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'returns'] })

  return {
    create: useMutation({ mutationFn: (p: CreateSalesReturnPayload) => salesReturnApi.create(p), onSuccess: invalidate }),
    createFromInvoice: useMutation({ mutationFn: (invoiceId: number) => salesReturnApi.createFromInvoice(invoiceId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateSalesReturnPayload }) => salesReturnApi.update(id, payload), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => salesReturnApi.approve(id), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => salesReturnApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => salesReturnApi.void(id, reason), onSuccess: invalidate }),
  }
}
