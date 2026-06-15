import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  SalesInvoice,
  SalesInvoiceListParams,
  CreateSalesInvoicePayload,
  UpdateSalesInvoicePayload,
} from '../types/salesInvoice.types'

export const salesInvoiceApi = {
  list: (params: SalesInvoiceListParams) =>
    http.get<unknown, PaginatedResponse<SalesInvoice>>('/sales/invoices', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}`),

  create: (payload: CreateSalesInvoicePayload) =>
    http.post<unknown, ApiResponse<SalesInvoice>>('/sales/invoices', payload),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-sales-order/${salesOrderId}`),

  createFromDeliveryOrder: (deliveryOrderId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-delivery-order/${deliveryOrderId}`),

  createFromProforma: (proformaId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-proforma/${proformaId}`),

  update: (id: number, payload: UpdateSalesInvoicePayload) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}`, payload),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/void`, { reason }),
}
