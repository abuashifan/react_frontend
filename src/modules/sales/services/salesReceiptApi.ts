import { http } from '@/services/http'
import { adaptSalesListRows } from './salesListAdapter'
import { adaptSalesDocument, adaptSalesPayload } from './salesTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  SalesReceipt,
  SalesReceiptListParams,
  CreateSalesReceiptPayload,
} from '../types/salesReceipt.types'
import type { SalesInvoice } from '../types/salesInvoice.types'

export interface SalesReceiptCustomerContext {
  customer_id: number
  gross_ar_outstanding: number
  official_ar_balance: number
  unapplied_deposit_total: number
  net_customer_exposure: number
  open_invoices: SalesInvoice[]
  available_deposits: Array<{ id: number; number?: string; deposit_number?: string; remaining_amount: number }>
}

export const salesReceiptApi = {
  list: async (params: SalesReceiptListParams) => {
    const res = await http.get<unknown, PaginatedResponse<SalesReceipt>>('/sales/receipts', { params })
    return { ...res, data: adaptSalesListRows(res.data, { date: 'receipt_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}`)
    return { ...res, data: adaptSalesDocument<SalesReceipt>(res.data, { dateFields: ['receipt_date'] }) }
  },

  getCustomerContext: (customerId: number) =>
    http.get<unknown, ApiResponse<SalesReceiptCustomerContext>>('/sales/receipts/customer-context', {
      params: { customer_id: customerId },
    }),

  create: (payload: CreateSalesReceiptPayload) =>
    http.post<unknown, ApiResponse<SalesReceipt>>('/sales/receipts', adaptSalesPayload(payload, { dateField: 'receipt_date' })),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}/void`, { reason }),
}
