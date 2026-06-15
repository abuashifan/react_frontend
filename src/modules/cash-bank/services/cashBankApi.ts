import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CashReceipt, CashPayment, BankTransfer, BankReconciliation,
  CashBankListParams, CreateCashReceiptPayload, CreateCashPaymentPayload,
  CreateBankTransferPayload, CreateBankReconciliationPayload,
} from '../types/cashBank.types'

export const cashReceiptApi = {
  list: (params: CashBankListParams) =>
    http.get<unknown, PaginatedResponse<CashReceipt>>('/cash-bank/cash-receipts', { params }),
  get: (id: number) =>
    http.get<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}`),
  create: (payload: CreateCashReceiptPayload) =>
    http.post<unknown, ApiResponse<CashReceipt>>('/cash-bank/cash-receipts', payload),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}/void`, { reason }),
}

export const cashPaymentApi = {
  list: (params: CashBankListParams) =>
    http.get<unknown, PaginatedResponse<CashPayment>>('/cash-bank/cash-payments', { params }),
  get: (id: number) =>
    http.get<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}`),
  create: (payload: CreateCashPaymentPayload) =>
    http.post<unknown, ApiResponse<CashPayment>>('/cash-bank/cash-payments', payload),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}/void`, { reason }),
}

export const bankTransferApi = {
  list: (params: CashBankListParams) =>
    http.get<unknown, PaginatedResponse<BankTransfer>>('/cash-bank/bank-transfers', { params }),
  get: (id: number) =>
    http.get<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}`),
  create: (payload: CreateBankTransferPayload) =>
    http.post<unknown, ApiResponse<BankTransfer>>('/cash-bank/bank-transfers', payload),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}/void`, { reason }),
}

export const bankReconciliationApi = {
  list: (params: Omit<CashBankListParams, 'status'> & { status?: string }) =>
    http.get<unknown, PaginatedResponse<BankReconciliation>>('/cash-bank/bank-reconciliations', { params }),
  get: (id: number) =>
    http.get<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}`),
  create: (payload: CreateBankReconciliationPayload) =>
    http.post<unknown, ApiResponse<BankReconciliation>>('/cash-bank/bank-reconciliations', payload),
  refreshLines: (id: number) =>
    http.patch<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}/refresh-lines`),
  markLines: (id: number, lineIds: number[], cleared: boolean, clearedDate?: string) =>
    http.patch<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}/mark-lines`, { line_ids: lineIds, cleared, cleared_date: clearedDate }),
  finalize: (id: number) =>
    http.patch<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}/finalize`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}/void`, { reason }),
}
