import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  SalesReceipt,
  SalesReceiptListParams,
  CreateSalesReceiptPayload,
} from '../types/salesReceipt.types'
import type { SalesInvoice } from '../types/salesInvoice.types'

/** Form memakai `date`, backend memvalidasi `receipt_date`. */
function toReceiptPayload({ date, ...rest }: CreateSalesReceiptPayload) {
  return { ...rest, receipt_date: date }
}

export const salesReceiptApi = {
  list: (params: SalesReceiptListParams) =>
    http.get<unknown, PaginatedResponse<SalesReceipt>>('/sales/receipts', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/sales/receipts/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}`),

  /**
   * Backend mengirim invoice terbuka dengan kunci `invoice_id`; form membaca `id`.
   * Tanpa alias ini `sales_invoice_id` kosong dan penerimaan ditolak 422.
   */
  getCustomerContext: async (customerId: number) => {
    const res = await http.get<unknown, ApiResponse<{ open_invoices: SalesInvoice[] }>>('/sales/receipts/customer-context', {
      params: { customer_id: customerId },
    })
    const open = (res.data?.open_invoices ?? []).map((inv) => ({
      ...inv,
      id: inv.id ?? (inv as unknown as { invoice_id: number }).invoice_id,
    }))
    return { ...res, data: { ...res.data, open_invoices: open } }
  },

  create: (payload: CreateSalesReceiptPayload) =>
    http.post<unknown, ApiResponse<SalesReceipt>>('/sales/receipts', toReceiptPayload(payload)),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}/void`, { reason }),

  /** Edit (mode lock/open): isian lengkap seperti buat baru; yang sudah posted diposting ulang. */
  update: (id: number, payload: CreateSalesReceiptPayload) =>
    http.patch<unknown, ApiResponse<SalesReceipt>>(`/sales/receipts/${id}`, toReceiptPayload(payload)),

  /** Hapus dokumen (mode lock/open). Draft dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/sales/receipts/${id}`, { data: reason ? { reason } : {} }),
}
