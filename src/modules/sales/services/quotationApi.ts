import { http } from '@/services/http'
import { adaptSalesListRows } from './salesListAdapter'
import { adaptSalesDocument, adaptSalesPayload } from './salesTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type {
  SalesQuotation,
  SalesQuotationListParams,
  CreateQuotationPayload,
  UpdateQuotationPayload,
} from '../types/quotation.types'

export const quotationApi = {
  list: async (params: SalesQuotationListParams) => {
    const res = await http.get<unknown, PaginatedResponse<SalesQuotation>>('/sales/quotations', { params })
    return { ...res, data: adaptSalesListRows(res.data, { date: 'quotation_date', expiry_date: 'valid_until' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}`)
    return { ...res, data: adaptSalesDocument<SalesQuotation>(res.data, { dateFields: ['quotation_date'], expiryFields: ['valid_until'] }) }
  },

  create: (payload: CreateQuotationPayload) =>
    http.post<unknown, ApiResponse<SalesQuotation>>('/sales/quotations', adaptSalesPayload(payload, { dateField: 'quotation_date', expiryField: 'valid_until' })),

  update: (id: number, payload: UpdateQuotationPayload) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}`, adaptSalesPayload(payload, { dateField: 'quotation_date', expiryField: 'valid_until' })),

  send: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/send`),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/approve`),

  accept: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/accept`),

  reject: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/reject`, { reason }),

  cancel: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/cancel`, { reason }),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<SalesQuotation>>('/sales/quotations', {
      params: { search: query, per_page: 10, status: 'approved' },
    })
    return res.data.map((q) => ({ value: q.id, label: q.number, sublabel: q.customer?.name }))
  },
}
