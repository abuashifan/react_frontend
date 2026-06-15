import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotationApi } from '../services/quotationApi'
import type { SalesQuotationListParams, CreateQuotationPayload, UpdateQuotationPayload } from '../types/quotation.types'

const QK = {
  list: (p: SalesQuotationListParams) => ['sales', 'quotations', p] as const,
  detail: (id: number) => ['sales', 'quotations', id] as const,
}

export function useQuotationList(params: SalesQuotationListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => quotationApi.list(params) })
}

export function useQuotation(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => quotationApi.get(id!),
    enabled: !!id,
  })
}

export function useQuotationMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'quotations'] })

  return {
    create: useMutation({ mutationFn: (p: CreateQuotationPayload) => quotationApi.create(p), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateQuotationPayload }) => quotationApi.update(id, payload), onSuccess: invalidate }),
    send: useMutation({ mutationFn: (id: number) => quotationApi.send(id), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => quotationApi.approve(id), onSuccess: invalidate }),
    accept: useMutation({ mutationFn: (id: number) => quotationApi.accept(id), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (id: number) => quotationApi.reject(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => quotationApi.cancel(id), onSuccess: invalidate }),
  }
}
