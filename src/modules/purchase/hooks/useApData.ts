import { useQuery } from '@tanstack/react-query'
import { apApi } from '../services/apApi'

export function useApVendorSummary() {
  return useQuery({ queryKey: ['purchase', 'ap', 'vendor-summary'], queryFn: apApi.vendorSummary })
}

export function useApAging() {
  return useQuery({ queryKey: ['purchase', 'ap', 'aging'], queryFn: apApi.aging })
}

export function useApReconciliation() {
  return useQuery({ queryKey: ['purchase', 'ap', 'reconciliation'], queryFn: apApi.reconciliation })
}

export function useVendorLedger(vendorId?: number | null) {
  return useQuery({
    queryKey: ['purchase', 'ap', 'vendor-ledger', vendorId],
    queryFn: () => apApi.vendorLedger(vendorId!),
    enabled: !!vendorId,
  })
}

export function useBillLedger(billId?: number | null) {
  return useQuery({
    queryKey: ['purchase', 'ap', 'bill-ledger', billId],
    queryFn: () => apApi.billLedger(billId!),
    enabled: !!billId,
  })
}
