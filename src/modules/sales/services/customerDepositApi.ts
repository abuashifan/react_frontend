import { http } from '@/services/http'
import { adaptSalesListRows } from './salesListAdapter'
import { adaptSalesDocument, adaptSalesPayload } from './salesTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CustomerDeposit,
  CustomerDepositListParams,
  CreateCustomerDepositPayload,
  AllocateDepositPayload,
} from '../types/customerDeposit.types'

export const customerDepositApi = {
  list: async (params: CustomerDepositListParams) => {
    const res = await http.get<unknown, PaginatedResponse<CustomerDeposit>>('/sales/customer-deposits', { params })
    return { ...res, data: adaptSalesListRows(res.data, { date: 'deposit_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}`)
    return { ...res, data: adaptSalesDocument<CustomerDeposit>(res.data, { dateFields: ['deposit_date'] }) }
  },

  listAvailable: (customerId: number) =>
    http.get<unknown, ApiResponse<CustomerDeposit[]>>('/sales/customer-deposits/available', {
      params: { customer_id: customerId },
    }),

  create: (payload: CreateCustomerDepositPayload) =>
    http.post<unknown, ApiResponse<CustomerDeposit>>('/sales/customer-deposits', adaptSalesPayload(payload, { dateField: 'deposit_date', sourceType: 'sales_order', sourceIdField: 'sales_order_id' })),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}/void`, { reason }),

  refund: (id: number, payload: { amount: number; reason: string }) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}/refund`, payload),

  allocateToInvoice: (depositId: number, invoiceId: number, payload: AllocateDepositPayload) =>
    http.post<unknown, ApiResponse<CustomerDeposit>>(
      `/sales/customer-deposits/${depositId}/allocate-to-invoice/${invoiceId}`,
      payload,
    ),
}
