import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CashReceipt, CashPayment, BankTransfer, BankReconciliation,
  CashBankListParams, CreateCashReceiptPayload, CreateCashPaymentPayload,
  CreateBankTransferPayload, CreateBankReconciliationPayload,
} from '../types/cashBank.types'
import type { SelectOption } from '@/types/common.types'

interface RawAccount {
  id: number
  account_code: string
  account_name: string
}

interface RawDimension {
  id: number
  code: string
  name: string
}

interface RawCashBankLine {
  id: number
  account_id: number
  account?: RawAccount | null
  amount: number | string
  description?: string | null
  department_id?: number | null
  department?: RawDimension | null
  project_id?: number | null
  project?: RawDimension | null
}

interface RawReconciliationLine {
  id: number
  journal_entry_id: number
  journal_entry_line_id: number
  journal_date: string
  journal_number: string
  description?: string | null
  debit: number | string
  credit: number | string
  is_cleared: boolean
  cleared_date?: string | null
}

function account(value?: RawAccount | null) {
  return value ? { id: value.id, code: value.account_code, name: value.account_name } : undefined
}

function mapLine(line: RawCashBankLine) {
  return {
    ...line,
    amount: Number(line.amount),
    account: account(line.account),
  }
}

function mapReceipt(raw: CashReceipt & { receipt_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }) : CashReceipt {
  return {
    ...raw,
    number: raw.receipt_number ?? raw.number,
    amount: Number(raw.amount),
    exchange_rate: Number(raw.exchange_rate),
    cash_bank_account: account(raw.cash_bank_account),
    lines: raw.lines.map(mapLine),
  }
}

function mapPayment(raw: CashPayment & { payment_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }): CashPayment {
  return {
    ...raw,
    number: raw.payment_number ?? raw.number,
    amount: Number(raw.amount),
    exchange_rate: Number(raw.exchange_rate),
    cash_bank_account: account(raw.cash_bank_account),
    lines: raw.lines.map(mapLine),
  }
}

function mapTransfer(raw: BankTransfer & { transfer_number?: string; from_cash_bank_account?: RawAccount; to_cash_bank_account?: RawAccount }): BankTransfer {
  return {
    ...raw,
    number: raw.transfer_number ?? raw.number,
    amount: Number(raw.amount),
    exchange_rate: Number(raw.exchange_rate),
    from_cash_bank_account: account(raw.from_cash_bank_account),
    to_cash_bank_account: account(raw.to_cash_bank_account),
  }
}

function mapReconciliation(raw: BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }): BankReconciliation {
  return {
    ...raw,
    number: raw.reconciliation_number ?? raw.number,
    statement_opening_balance: Number(raw.statement_opening_balance),
    statement_ending_balance: Number(raw.statement_ending_balance),
    cash_bank_account: account(raw.cash_bank_account),
    lines: raw.lines.map((line) => ({
      ...line,
      debit: Number(line.debit),
      credit: Number(line.credit),
    })),
  }
}

function mapPage<TInput, TOutput>(response: PaginatedResponse<TInput>, mapper: (value: TInput) => TOutput): PaginatedResponse<TOutput> {
  return { ...response, data: response.data.map(mapper) }
}

async function mapDetail<TInput, TOutput>(promise: Promise<ApiResponse<TInput>>, mapper: (value: TInput) => TOutput): Promise<ApiResponse<TOutput>> {
  const response = await promise
  return { ...response, data: mapper(response.data) }
}

export const cashBankAccountApi = {
  search: async (query: string): Promise<SelectOption<number>[]> => {
    const response = await http.get<unknown, ApiResponse<{ accounts: Array<RawAccount & { is_active: boolean }> }>>('/cash-bank/accounts')
    const normalizedQuery = query.trim().toLowerCase()
    return response.data.accounts
      .filter((item) => item.is_active && (
        normalizedQuery === ''
        || item.account_code.toLowerCase().includes(normalizedQuery)
        || item.account_name.toLowerCase().includes(normalizedQuery)
      ))
      .slice(0, 10)
      .map((item) => ({ value: item.id, label: item.account_name, sublabel: item.account_code }))
  },
}

export const cashReceiptApi = {
  list: async (params: CashBankListParams) =>
    mapPage(await http.get<unknown, PaginatedResponse<CashReceipt & { receipt_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>('/cash-bank/cash-receipts', { params }), mapReceipt),
  get: (id: number) =>
    mapDetail(http.get<unknown, ApiResponse<CashReceipt & { receipt_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>(`/cash-bank/cash-receipts/${id}`), mapReceipt),
  create: (payload: CreateCashReceiptPayload) =>
    mapDetail(http.post<unknown, ApiResponse<CashReceipt & { receipt_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>('/cash-bank/cash-receipts', payload), mapReceipt),
  update: (id: number, payload: CreateCashReceiptPayload) =>
    mapDetail(http.patch<unknown, ApiResponse<CashReceipt & { receipt_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>(`/cash-bank/cash-receipts/${id}`, payload), mapReceipt),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}/void`, { reason }),
}

export const cashPaymentApi = {
  list: async (params: CashBankListParams) =>
    mapPage(await http.get<unknown, PaginatedResponse<CashPayment & { payment_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>('/cash-bank/cash-payments', { params }), mapPayment),
  get: (id: number) =>
    mapDetail(http.get<unknown, ApiResponse<CashPayment & { payment_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>(`/cash-bank/cash-payments/${id}`), mapPayment),
  create: (payload: CreateCashPaymentPayload) =>
    mapDetail(http.post<unknown, ApiResponse<CashPayment & { payment_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>('/cash-bank/cash-payments', payload), mapPayment),
  update: (id: number, payload: CreateCashPaymentPayload) =>
    mapDetail(http.patch<unknown, ApiResponse<CashPayment & { payment_number?: string; lines: RawCashBankLine[]; cash_bank_account?: RawAccount }>>(`/cash-bank/cash-payments/${id}`, payload), mapPayment),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}/void`, { reason }),
}

export const bankTransferApi = {
  list: async (params: CashBankListParams) =>
    mapPage(await http.get<unknown, PaginatedResponse<BankTransfer & { transfer_number?: string; from_cash_bank_account?: RawAccount; to_cash_bank_account?: RawAccount }>>('/cash-bank/bank-transfers', { params }), mapTransfer),
  get: (id: number) =>
    mapDetail(http.get<unknown, ApiResponse<BankTransfer & { transfer_number?: string; from_cash_bank_account?: RawAccount; to_cash_bank_account?: RawAccount }>>(`/cash-bank/bank-transfers/${id}`), mapTransfer),
  create: (payload: CreateBankTransferPayload) =>
    mapDetail(http.post<unknown, ApiResponse<BankTransfer & { transfer_number?: string; from_cash_bank_account?: RawAccount; to_cash_bank_account?: RawAccount }>>('/cash-bank/bank-transfers', payload), mapTransfer),
  update: (id: number, payload: CreateBankTransferPayload) =>
    mapDetail(http.patch<unknown, ApiResponse<BankTransfer & { transfer_number?: string; from_cash_bank_account?: RawAccount; to_cash_bank_account?: RawAccount }>>(`/cash-bank/bank-transfers/${id}`, payload), mapTransfer),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}/void`, { reason }),
}

// Backend hanya menyediakan: index, store, show, PATCH update, POST refresh-lines,
// POST mark-lines. Tidak ada finalize/void/post — rekonsiliasi selalu berstatus draft.
// (Lihat app/Modules/CashBank/Routes/api.php — A11-12 / issue-04.)
export const bankReconciliationApi = {
  list: async (params: Omit<CashBankListParams, 'status'> & { status?: string }) =>
    mapPage(await http.get<unknown, PaginatedResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>('/cash-bank/bank-reconciliations', { params }), mapReconciliation),
  get: (id: number) =>
    mapDetail(http.get<unknown, ApiResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>(`/cash-bank/bank-reconciliations/${id}`), mapReconciliation),
  create: (payload: CreateBankReconciliationPayload) =>
    mapDetail(http.post<unknown, ApiResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>('/cash-bank/bank-reconciliations', payload), mapReconciliation),
  update: (id: number, payload: Partial<CreateBankReconciliationPayload>) =>
    mapDetail(http.patch<unknown, ApiResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>(`/cash-bank/bank-reconciliations/${id}`, payload), mapReconciliation),
  refreshLines: (id: number, resetCleared = false) =>
    mapDetail(http.post<unknown, ApiResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>(`/cash-bank/bank-reconciliations/${id}/refresh-lines`, { reset_cleared: resetCleared }), mapReconciliation),
  markLines: (id: number, lineIds: number[], cleared: boolean, clearedDate?: string) =>
    mapDetail(http.post<unknown, ApiResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>(`/cash-bank/bank-reconciliations/${id}/mark-lines`, { line_ids: lineIds, cleared, cleared_date: clearedDate }), mapReconciliation),
  finalize: (id: number) =>
    mapDetail(http.post<unknown, ApiResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>(`/cash-bank/bank-reconciliations/${id}/finalize`), mapReconciliation),
  reopen: (id: number, reason: string) =>
    mapDetail(http.post<unknown, ApiResponse<BankReconciliation & { reconciliation_number?: string; cash_bank_account?: RawAccount; lines: RawReconciliationLine[] }>>(`/cash-bank/bank-reconciliations/${id}/reopen`, { reason }), mapReconciliation),
}
