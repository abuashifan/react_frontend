import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesReceiptApi } from '../services/salesReceiptApi'
import type { SalesReceiptListParams, CreateSalesReceiptPayload } from '../types/salesReceipt.types'

const QK = {
  list: (p: SalesReceiptListParams) => ['sales', 'receipts', p] as const,
  detail: (id: number) => ['sales', 'receipts', id] as const,
  customerContext: (customerId: number) => ['sales', 'receipts', 'customer-context', customerId] as const,
}

export function useSalesReceiptList(params: SalesReceiptListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => salesReceiptApi.list(params) })
}

export function useSalesReceipt(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => salesReceiptApi.get(id!),
    enabled: !!id,
  })
}

export function useCustomerOpenInvoices(customerId?: number) {
  return useQuery({
    queryKey: QK.customerContext(customerId!),
    queryFn: () => salesReceiptApi.getCustomerContext(customerId!),
    enabled: !!customerId,
  })
}

export function useSalesReceiptMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['sales', 'receipts'] })

  return {
    create: useMutation({ mutationFn: (p: CreateSalesReceiptPayload) => salesReceiptApi.create(p), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => salesReceiptApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => salesReceiptApi.void(id, reason), onSuccess: invalidate }),
  }
}
