import { useQuery } from '@tanstack/react-query'
import { arApi } from '../services/arApi'
import type { ArSummaryParams, ArAgingParams, CustomerLedgerParams, InvoiceLedgerParams } from '../types/ar.types'

export function useArCustomerSummary(params?: ArSummaryParams) {
  return useQuery({
    queryKey: ['sales', 'ar', 'customer-summary', params],
    queryFn: () => arApi.customerSummary(params),
  })
}

export function useArAging(params?: ArAgingParams) {
  return useQuery({
    queryKey: ['sales', 'ar', 'aging', params],
    queryFn: () => arApi.aging(params),
  })
}

export function useArReconciliation() {
  return useQuery({
    queryKey: ['sales', 'ar', 'reconciliation'],
    queryFn: () => arApi.reconciliation(),
  })
}

export function useCustomerLedger(customerId?: number, params?: CustomerLedgerParams) {
  return useQuery({
    queryKey: ['sales', 'ar', 'customer-ledger', customerId, params],
    queryFn: () => arApi.customerLedger(customerId!, params),
    enabled: !!customerId,
  })
}

export function useInvoiceLedger(invoiceId?: number, params?: InvoiceLedgerParams) {
  return useQuery({
    queryKey: ['sales', 'ar', 'invoice-ledger', invoiceId, params],
    queryFn: () => arApi.invoiceLedger(invoiceId!, params),
    enabled: !!invoiceId,
  })
}
