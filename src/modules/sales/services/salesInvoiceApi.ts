import { http } from '@/services/http'
import { adaptSalesListRows } from './salesListAdapter'
import { adaptSalesDocument, adaptSalesPayload } from './salesTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  SalesInvoice,
  SalesInvoiceListParams,
  CreateSalesInvoicePayload,
  UpdateSalesInvoicePayload,
} from '../types/salesInvoice.types'

export const salesInvoiceApi = {
  list: async (params: SalesInvoiceListParams) => {
    const res = await http.get<unknown, PaginatedResponse<SalesInvoice>>('/sales/invoices', { params })
    return { ...res, data: adaptSalesListRows(res.data, { date: 'invoice_date', due_date: 'due_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}`)
    return { ...res, data: adaptSalesDocument<SalesInvoice>(res.data, { dateFields: ['invoice_date'] }) }
  },

  create: (payload: CreateSalesInvoicePayload) =>
    http.post<unknown, ApiResponse<SalesInvoice>>('/sales/invoices', adaptSalesPayload(payload, { dateField: 'invoice_date' })),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-sales-order/${salesOrderId}`),

  createFromDeliveryOrder: (deliveryOrderId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-delivery-order/${deliveryOrderId}`),

  createFromProforma: (proformaId: number) =>
    http.post<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/from-proforma/${proformaId}`),

  update: (id: number, payload: UpdateSalesInvoicePayload) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}`, adaptSalesPayload(payload, { dateField: 'invoice_date' })),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/approve`),

  post: (id: number, appliedDownPaymentAmount?: number) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/post`, {
      applied_down_payment_amount: appliedDownPaymentAmount,
    }),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesInvoice>>(`/sales/invoices/${id}/void`, { reason }),
}
