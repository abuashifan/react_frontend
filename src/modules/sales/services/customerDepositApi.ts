import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  CustomerDeposit,
  CustomerDepositListParams,
  CreateCustomerDepositPayload,
  AllocateDepositPayload,
} from '../types/customerDeposit.types'

export const customerDepositApi = {
  list: (params: CustomerDepositListParams) =>
    http.get<unknown, PaginatedResponse<CustomerDeposit>>('/sales/customer-deposits', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/sales/customer-deposits/adjacent', { params: { id } }),

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

  /** Edit (mode lock/open): isian lengkap seperti buat baru; yang sudah posted diposting ulang. */
  update: (id: number, payload: CreateCustomerDepositPayload) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}`, payload),

  /** Hapus dokumen (mode lock/open). Tanpa efek dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/sales/customer-deposits/${id}`, { data: reason ? { reason } : {} }),

  refund: (id: number) =>
    http.patch<unknown, ApiResponse<CustomerDeposit>>(`/sales/customer-deposits/${id}/refund`),

  allocateToInvoice: (depositId: number, invoiceId: number, payload: AllocateDepositPayload) =>
    http.post<unknown, ApiResponse<CustomerDeposit>>(
      `/sales/customer-deposits/${depositId}/allocate-to-invoice/${invoiceId}`,
      payload,
    ),
}
