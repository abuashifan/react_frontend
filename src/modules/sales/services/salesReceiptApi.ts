import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  SalesReceipt,
  SalesReceiptListParams,
  CreateSalesReceiptPayload,
} from '../types/salesReceipt.types'
import type { SalesInvoice } from '../types/salesInvoice.types'

export const salesReceiptApi = {
  list: (params: SalesReceiptListParams) =>
    http.get<unknown, PaginatedResponse<SalesReceipt>>('/sales/receipts', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}`),

  getCustomerContext: (customerId: number) =>
    http.get<unknown, ApiResponse<{ open_invoices: SalesInvoice[] }>>('/sales/receipts/customer-context', {
      params: { customer_id: customerId },
    }),

  create: (payload: CreateSalesReceiptPayload) =>
    http.post<unknown, ApiResponse<SalesReceipt>>('/sales/receipts', payload),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}/void`, { reason }),
}
