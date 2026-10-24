import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  SalesInvoice,
  SalesInvoiceListParams,
  CreateSalesInvoicePayload,
  UpdateSalesInvoicePayload,
} from '../types/salesInvoice.types'

/**
 * Form memakai `date`; backend mewajibkan `invoice_date`. Tanpa pemetaan ini
 * membuat/mengubah invoice selalu ditolak 422 "invoice date field is required".
 */
function toInvoicePayload({ date, ...rest }: Partial<CreateSalesInvoicePayload>) {
  return date === undefined ? rest : { ...rest, invoice_date: date }
}

export const salesInvoiceApi = {
  list: (params: SalesInvoiceListParams) =>
    http.get<unknown, PaginatedResponse<SalesInvoice>>('/sales/invoices', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/sales/invoices/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}`),

  create: (payload: CreateSalesInvoicePayload) =>
    http.post<unknown, ApiResponse<SalesInvoice>>('/sales/invoices', toInvoicePayload(payload)),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-sales-order/${salesOrderId}`),

  createFromDeliveryOrder: (deliveryOrderId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-delivery-order/${deliveryOrderId}`),

  createFromProforma: (proformaId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-proforma/${proformaId}`),

  update: (id: number, payload: UpdateSalesInvoicePayload) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}`, toInvoicePayload(payload)),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/void`, { reason }),

  /** Hapus dokumen (mode lock/open). Draft dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/sales/invoices/${id}`, { data: reason ? { reason } : {} }),
}
