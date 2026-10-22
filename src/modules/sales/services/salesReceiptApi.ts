import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  SalesReceipt,
  SalesReceiptListParams,
  CreateSalesReceiptPayload,
} from '../types/salesReceipt.types'
import type { SalesInvoice } from '../types/salesInvoice.types'

export const salesReceiptApi = {
  list: (params: SalesReceiptListParams) =>
    http.get<unknown, PaginatedResponse<SalesReceipt>>('/sales/receipts', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/sales/receipts/adjacent', { params: { id } }),

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

  /** Edit (mode lock/open): isian lengkap seperti buat baru; yang sudah posted diposting ulang. */
  update: (id: number, payload: CreateSalesReceiptPayload) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}`, payload),

  /** Hapus dokumen (mode lock/open). Draft dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/sales/receipts/${id}`, { data: reason ? { reason } : {} }),
}
