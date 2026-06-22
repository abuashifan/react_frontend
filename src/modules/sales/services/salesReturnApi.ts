import { http } from '@/services/http'
import { adaptSalesListRows } from './salesListAdapter'
import { adaptSalesDocument, adaptSalesPayload } from './salesTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  SalesReturn,
  SalesReturnListParams,
  CreateSalesReturnPayload,
  UpdateSalesReturnPayload,
} from '../types/salesReturn.types'

export const salesReturnApi = {
  list: async (params: SalesReturnListParams) => {
    const res = await http.get<unknown, PaginatedResponse<SalesReturn>>('/sales/returns', { params })
    return { ...res, data: adaptSalesListRows(res.data, { date: 'return_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}`)
    return { ...res, data: adaptSalesDocument<SalesReturn>(res.data, { dateFields: ['return_date'] }) }
  },

  create: (payload: CreateSalesReturnPayload) =>
    http.post<unknown, ApiResponse<SalesReturn>>('/sales/returns', adaptSalesPayload(payload, { dateField: 'return_date' })),

  createFromInvoice: (invoiceId: number) =>
    http.post<unknown, ApiResponse<SalesReturn>>(`/sales/returns/from-invoice/${invoiceId}`),

  createFromDeliveryOrder: (doId: number) =>
    http.post<unknown, ApiResponse<SalesReturn>>(`/sales/returns/from-delivery-order/${doId}`),

  update: (id: number, payload: UpdateSalesReturnPayload) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}`, adaptSalesPayload(payload, { dateField: 'return_date' })),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/void`, { reason }),
}
