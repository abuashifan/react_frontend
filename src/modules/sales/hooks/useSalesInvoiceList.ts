import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesInvoiceApi } from '../services/salesInvoiceApi'
import type { SalesInvoiceListParams, CreateSalesInvoicePayload, UpdateSalesInvoicePayload } from '../types/salesInvoice.types'

const QK = {
  list: (p: SalesInvoiceListParams) => ['sales', 'invoices', p] as const,
  detail: (id: number) => ['sales', 'invoices', id] as const,
}

export function useSalesInvoiceList(params: SalesInvoiceListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => salesInvoiceApi.list(params) })
}

export function useSalesInvoice(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => salesInvoiceApi.get(id!),
    enabled: !!id,
  })
}

export function useSalesInvoiceMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'invoices'] })

  return {
    create: useMutation({ mutationFn: (p: CreateSalesInvoicePayload) => salesInvoiceApi.create(p), onSuccess: invalidate }),
    createFromSalesOrder: useMutation({ mutationFn: (soId: number) => salesInvoiceApi.createFromSalesOrder(soId), onSuccess: invalidate }),
    createFromDeliveryOrder: useMutation({ mutationFn: (doId: number) => salesInvoiceApi.createFromDeliveryOrder(doId), onSuccess: invalidate }),
    createFromProforma: useMutation({ mutationFn: (proformaId: number) => salesInvoiceApi.createFromProforma(proformaId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateSalesInvoicePayload }) => salesInvoiceApi.update(id, payload), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => salesInvoiceApi.approve(id), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => salesInvoiceApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => salesInvoiceApi.void(id, reason), onSuccess: invalidate }),
  }
}
