import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashReceiptApi, cashPaymentApi, bankTransferApi, bankReconciliationApi } from '../services/cashBankApi'
import type { CashBankListParams, CreateCashReceiptPayload, CreateCashPaymentPayload, CreateBankTransferPayload, CreateBankReconciliationPayload } from '../types/cashBank.types'

// Cash Receipts
export function useCashReceiptList(params: CashBankListParams) {
  return useQuery({ queryKey: ['cash-bank', 'receipts', params], queryFn: () => cashReceiptApi.list(params) })
}
export function useCashReceipt(id?: number) {
  return useQuery({ queryKey: ['cash-bank', 'receipts', id], queryFn: () => cashReceiptApi.get(id!), enabled: !!id })
}
export function useCashReceiptMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['cash-bank', 'receipts'] })
  return {
    create: useMutation({ mutationFn: (p: CreateCashReceiptPayload) => cashReceiptApi.create(p), onSuccess: inv }),
    post: useMutation({ mutationFn: (id: number) => cashReceiptApi.post(id), onSuccess: inv }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => cashReceiptApi.void(id, reason), onSuccess: inv }),
  }
}

// Cash Payments
export function useCashPaymentList(params: CashBankListParams) {
  return useQuery({ queryKey: ['cash-bank', 'payments', params], queryFn: () => cashPaymentApi.list(params) })
}
export function useCashPayment(id?: number) {
  return useQuery({ queryKey: ['cash-bank', 'payments', id], queryFn: () => cashPaymentApi.get(id!), enabled: !!id })
}
export function useCashPaymentMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['cash-bank', 'payments'] })
  return {
    create: useMutation({ mutationFn: (p: CreateCashPaymentPayload) => cashPaymentApi.create(p), onSuccess: inv }),
    post: useMutation({ mutationFn: (id: number) => cashPaymentApi.post(id), onSuccess: inv }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => cashPaymentApi.void(id, reason), onSuccess: inv }),
  }
}

// Bank Transfers
export function useBankTransferList(params: CashBankListParams) {
  return useQuery({ queryKey: ['cash-bank', 'transfers', params], queryFn: () => bankTransferApi.list(params) })
}
export function useBankTransfer(id?: number) {
  return useQuery({ queryKey: ['cash-bank', 'transfers', id], queryFn: () => bankTransferApi.get(id!), enabled: !!id })
}
export function useBankTransferMutations() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: ['cash-bank', 'transfers'] })
  return {
    create: useMutation({ mutationFn: (p: CreateBankTransferPayload) => bankTransferApi.create(p), onSuccess: inv }),
    post: useMutation({ mutationFn: (id: number) => bankTransferApi.post(id), onSuccess: inv }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => bankTransferApi.void(id, reason), onSuccess: inv }),
  }
}

// Bank Reconciliation
export function useBankReconciliationList(params: Omit<CashBankListParams, 'status'> & { status?: string }) {
  return useQuery({ queryKey: ['cash-bank', 'reconciliations', params], queryFn: () => bankReconciliationApi.list(params) })
}
export function useBankReconciliation(id?: number) {
  return useQuery({ queryKey: ['cash-bank', 'reconciliations', id], queryFn: () => bankReconciliationApi.get(id!), enabled: !!id })
}
export function useBankReconciliationMutations() {
  const qc = useQueryClient()
  const inv = (id?: number) => {
    void qc.invalidateQueries({ queryKey: ['cash-bank', 'reconciliations'] })
    if (id) void qc.invalidateQueries({ queryKey: ['cash-bank', 'reconciliations', id] })
  }
  return {
    create: useMutation({ mutationFn: (p: CreateBankReconciliationPayload) => bankReconciliationApi.create(p), onSuccess: () => inv() }),
    refreshLines: useMutation({ mutationFn: (id: number) => bankReconciliationApi.refreshLines(id), onSuccess: (_, id) => inv(id) }),
    markLines: useMutation({
      mutationFn: ({ id, lineIds, cleared, clearedDate }: { id: number; lineIds: number[]; cleared: boolean; clearedDate?: string }) =>
        bankReconciliationApi.markLines(id, lineIds, cleared, clearedDate),
      onSuccess: (_, { id }) => inv(id),
    }),
    finalize: useMutation({ mutationFn: (id: number) => bankReconciliationApi.finalize(id), onSuccess: (_, id) => inv(id) }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => bankReconciliationApi.void(id, reason), onSuccess: () => inv() }),
  }
}
