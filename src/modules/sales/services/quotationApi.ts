import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type {
  SalesQuotation,
  SalesQuotationListParams,
  CreateQuotationPayload,
  UpdateQuotationPayload,
} from '../types/quotation.types'

export const quotationApi = {
  list: (params: SalesQuotationListParams) =>
    http.get<unknown, PaginatedResponse<SalesQuotation>>('/sales/quotations', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}`),

  create: (payload: CreateQuotationPayload) =>
    http.post<unknown, ApiResponse<SalesQuotation>>('/sales/quotations', payload),

  update: (id: number, payload: UpdateQuotationPayload) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}`, payload),

  send: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/send`),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/approve`),

  accept: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/accept`),

  reject: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/reject`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<SalesQuotation>>(`/sales/quotations/${id}/cancel`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<SalesQuotation>>('/sales/quotations', {
      params: { search: query, per_page: 10, status: 'approved' },
    })
    return res.data.map((q) => ({ value: q.id, label: q.number, sublabel: q.customer?.name }))
  },
}
