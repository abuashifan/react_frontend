import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesOrderApi } from '../services/salesOrderApi'
import type { SalesOrderListParams, CreateSalesOrderPayload, UpdateSalesOrderPayload } from '../types/salesOrder.types'

const QK = {
  list: (p: SalesOrderListParams) => ['sales', 'orders', p] as const,
  detail: (id: number) => ['sales', 'orders', id] as const,
}

export function useSalesOrderList(params: SalesOrderListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => salesOrderApi.list(params) })
}

export function useSalesOrder(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => salesOrderApi.get(id!),
    enabled: !!id,
  })
}

export function useSalesOrderMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'orders'] })

  return {
    create: useMutation({ mutationFn: (p: CreateSalesOrderPayload) => salesOrderApi.create(p), onSuccess: invalidate }),
    createFromQuotation: useMutation({ mutationFn: (quotationId: number) => salesOrderApi.createFromQuotation(quotationId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateSalesOrderPayload }) => salesOrderApi.update(id, payload), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => salesOrderApi.approve(id), onSuccess: invalidate }),
    confirm: useMutation({ mutationFn: (id: number) => salesOrderApi.confirm(id), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: number) => salesOrderApi.cancel(id), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (id: number) => salesOrderApi.close(id), onSuccess: invalidate }),
  }
}
