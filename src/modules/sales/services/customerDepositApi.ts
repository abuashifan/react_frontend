import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  CustomerDeposit,
  CustomerDepositListParams,
  CreateCustomerDepositPayload,
  AllocateDepositPayload,
} from '../types/customerDeposit.types'

export const customerDepositApi = {
  list: (params: CustomerDepositListParams) =>
    http.get<unknown, PaginatedResponse<CustomerDeposit>>('/sales/customer-deposits', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}`),

  listAvailable: (customerId: number) =>
    http.get<unknown, ApiResponse<CustomerDeposit[]>>('/sales/customer-deposits/available', {
      params: { customer_id: customerId },
    }),

  create: (payload: CreateCustomerDepositPayload) =>
    http.post<unknown, ApiResponse<CustomerDeposit>>('/sales/customer-deposits', payload),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}/void`, { reason }),

  refund: (id: number) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}/refund`),

  allocateToInvoice: (depositId: number, invoiceId: number, payload: AllocateDepositPayload) =>
    http.post<unknown, ApiResponse<CustomerDeposit>>(
      `/sales/customer-deposits/${depositId}/allocate-to-invoice/${invoiceId}`,
      payload,
    ),
}
