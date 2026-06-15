import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proformaApi } from '../services/proformaApi'
import type { ProformaListParams, CreateProformaPayload, UpdateProformaPayload } from '../types/proforma.types'

const QK = {
  list: (p: ProformaListParams) => ['sales', 'proformas', p] as const,
  detail: (id: number) => ['sales', 'proformas', id] as const,
}

export function useProformaList(params: ProformaListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => proformaApi.list(params) })
}

export function useProforma(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => proformaApi.get(id!),
    enabled: !!id,
  })
}

export function useProformaMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'proformas'] })

  return {
    create: useMutation({ mutationFn: (p: CreateProformaPayload) => proformaApi.create(p), onSuccess: invalidate }),
    createFromSalesOrder: useMutation({ mutationFn: (soId: number) => proformaApi.createFromSalesOrder(soId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateProformaPayload }) => proformaApi.update(id, payload), onSuccess: invalidate }),
    issue: useMutation({ mutationFn: (id: number) => proformaApi.issue(id), onSuccess: invalidate }),
    accept: useMutation({ mutationFn: (id: number) => proformaApi.accept(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => proformaApi.cancel(id), onSuccess: invalidate }),
  }
}
