import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { PaymentTerms, CreatePaymentTermsPayload, UpdatePaymentTermsPayload } from '../types/paymentTerms.types'

export const paymentTermsApi = {
  list: (params?: { search?: string }) =>
    http.get<unknown, PaginatedResponse<PaymentTerms>>('/master-data/payment-terms', { params }),

  create: (payload: CreatePaymentTermsPayload) =>
    http.post<unknown, ApiResponse<PaymentTerms>>('/master-data/payment-terms', payload),

  update: (id: number, payload: UpdatePaymentTermsPayload) =>
    http.patch<unknown, ApiResponse<PaymentTerms>>(`/master-data/payment-terms/${id}`, payload),

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/payment-terms/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/payment-terms/${id}/deactivate`),

  search: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<PaymentTerms>>(
      '/master-data/payment-terms',
      { params: { search: query, per_page: 10 } },
    )
    return res.data.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: `${p.days} hari`,
    }))
  },
}
