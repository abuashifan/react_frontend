import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  CashReceipt, CashPayment, BankTransfer, BankReconciliation,
  CashBankListParams, CreateCashReceiptPayload, CreateCashPaymentPayload,
  CreateBankTransferPayload, CreateBankReconciliationPayload,
} from '../types/cashBank.types'

type AccountRef = { id: number; code: string; name: string }
type RawAccountRef = { id: number; code?: string; name?: string; account_code?: string; account_name?: string } | null | undefined

/**
 * Backend mengirim akun COA dengan `account_code`/`account_name`, sedangkan form
 * Kas & Bank membaca `code`/`name`. Tanpa penyesuaian ini dokumen tersimpan
 * menampilkan "#id" dan "Pilih akun..." walau akunnya sudah terisi.
 */
function accountRef(raw: RawAccountRef): AccountRef | undefined {
  if (!raw) return undefined
  return { id: raw.id, code: raw.code ?? raw.account_code ?? '', name: raw.name ?? raw.account_name ?? '' }
}

function withAccountRefs<T extends { cash_bank_account?: AccountRef; lines?: { account?: AccountRef }[] }>(document: T): T {
  return {
    ...document,
    cash_bank_account: accountRef(document.cash_bank_account),
    lines: document.lines?.map((line) => ({ ...line, account: accountRef(line.account) })),
  }
}

export const cashReceiptApi = {
  list: (params: CashBankListParams) =>
    http.get<unknown, PaginatedResponse<CashReceipt>>('/cash-bank/cash-receipts', { params }),
  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/cash-bank/cash-receipts/adjacent', { params: { id } }),
  get: async (id: number) => {
    const response = await http.get<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}`)
    return { ...response, data: withAccountRefs(response.data) }
  },
  create: (payload: CreateCashReceiptPayload) =>
    http.post<unknown, ApiResponse<CashReceipt>>('/cash-bank/cash-receipts', payload),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}/void`, { reason }),
  /** Edit (mode lock/open): isian lengkap seperti buat baru; yang sudah posted diposting ulang. */
  update: (id: number, payload: CreateCashReceiptPayload) =>
    http.patch<unknown, ApiResponse<CashReceipt>>(`/cash-bank/cash-receipts/${id}`, payload),
  /** Hapus dokumen (mode lock/open). Draft dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/cash-bank/cash-receipts/${id}`, { data: reason ? { reason } : {} }),
}

export const cashPaymentApi = {
  list: (params: CashBankListParams) =>
    http.get<unknown, PaginatedResponse<CashPayment>>('/cash-bank/cash-payments', { params }),
  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/cash-bank/cash-payments/adjacent', { params: { id } }),
  get: async (id: number) => {
    const response = await http.get<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}`)
    return { ...response, data: withAccountRefs(response.data) }
  },
  create: (payload: CreateCashPaymentPayload) =>
    http.post<unknown, ApiResponse<CashPayment>>('/cash-bank/cash-payments', payload),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}/void`, { reason }),
  /** Edit (mode lock/open): isian lengkap seperti buat baru; yang sudah posted diposting ulang. */
  update: (id: number, payload: CreateCashPaymentPayload) =>
    http.patch<unknown, ApiResponse<CashPayment>>(`/cash-bank/cash-payments/${id}`, payload),
  /** Hapus dokumen (mode lock/open). Draft dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/cash-bank/cash-payments/${id}`, { data: reason ? { reason } : {} }),
}

export const bankTransferApi = {
  list: (params: CashBankListParams) =>
    http.get<unknown, PaginatedResponse<BankTransfer>>('/cash-bank/bank-transfers', { params }),
  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/cash-bank/bank-transfers/adjacent', { params: { id } }),
  get: async (id: number) => {
    const response = await http.get<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}`)
    return { ...response, data: {
      ...response.data,
      from_cash_bank_account: accountRef(response.data.from_cash_bank_account),
      to_cash_bank_account: accountRef(response.data.to_cash_bank_account),
    } }
  },
  create: (payload: CreateBankTransferPayload) =>
    http.post<unknown, ApiResponse<BankTransfer>>('/cash-bank/bank-transfers', payload),
  post: (id: number) =>
    http.patch<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}/post`),
  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}/void`, { reason }),

  /** Edit (mode lock/open): isian lengkap seperti buat baru; yang sudah posted diposting ulang. */
  update: (id: number, payload: CreateBankTransferPayload) =>
    http.patch<unknown, ApiResponse<BankTransfer>>(`/cash-bank/bank-transfers/${id}`, payload),

  /** Hapus dokumen (mode lock/open). Tanpa efek dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/cash-bank/bank-transfers/${id}`, { data: reason ? { reason } : {} }),
}

// Backend hanya menyediakan: index, store, show, PATCH update, POST refresh-lines,
// POST mark-lines. Tidak ada finalize/void/post — rekonsiliasi selalu berstatus draft.
// (Lihat app/Modules/CashBank/Routes/api.php — A11-12 / issue-04.)
export const bankReconciliationApi = {
  list: (params: Omit<CashBankListParams, 'status'> & { status?: string }) =>
    http.get<unknown, PaginatedResponse<BankReconciliation>>('/cash-bank/bank-reconciliations', { params }),
  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/cash-bank/bank-reconciliations/adjacent', { params: { id } }),
  get: (id: number) =>
    http.get<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}`),
  create: (payload: CreateBankReconciliationPayload) =>
    http.post<unknown, ApiResponse<BankReconciliation>>('/cash-bank/bank-reconciliations', payload),
  update: (id: number, payload: Partial<CreateBankReconciliationPayload>) =>
    http.patch<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}`, payload),
  refreshLines: (id: number) =>
    http.post<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}/refresh-lines`),
  markLines: (id: number, lineIds: number[], cleared: boolean, clearedDate?: string) =>
    http.post<unknown, ApiResponse<BankReconciliation>>(`/cash-bank/bank-reconciliations/${id}/mark-lines`, { line_ids: lineIds, cleared, cleared_date: clearedDate }),
}
