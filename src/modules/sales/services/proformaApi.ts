import { http } from '@/services/http'
import { adaptSalesListRows } from './salesListAdapter'
import { adaptSalesDocument, adaptSalesPayload } from './salesTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  ProformaInvoice,
  ProformaListParams,
  CreateProformaPayload,
  UpdateProformaPayload,
} from '../types/proforma.types'

export const proformaApi = {
  list: async (params: ProformaListParams) => {
    const res = await http.get<unknown, PaginatedResponse<ProformaInvoice>>('/sales/proformas', { params })
    return { ...res, data: adaptSalesListRows(res.data, { date: 'proforma_date', valid_until: 'valid_until', expiry_date: 'valid_until' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}`)
    return { ...res, data: adaptSalesDocument<ProformaInvoice>(res.data, { dateFields: ['proforma_date'], expiryFields: ['valid_until'] }) }
  },

  create: (payload: CreateProformaPayload) =>
    http.post<unknown, ApiResponse<ProformaInvoice>>('/sales/proformas', adaptSalesPayload(payload, { dateField: 'proforma_date', expiryField: 'valid_until', sourceType: 'sales_order', sourceIdField: 'sales_order_id' })),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/from-sales-order/${salesOrderId}`),

  update: (id: number, payload: UpdateProformaPayload) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}`, adaptSalesPayload(payload, { dateField: 'proforma_date', expiryField: 'valid_until', sourceType: 'sales_order', sourceIdField: 'sales_order_id' })),

  issue: (id: number) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}/issue`),

  accept: (id: number) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}/accept`),

  cancel: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}/cancel`, { reason }),
}
