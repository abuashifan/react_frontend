import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  SalesReturn,
  SalesReturnListParams,
  CreateSalesReturnPayload,
  UpdateSalesReturnPayload,
} from '../types/salesReturn.types'


/** Form memakai `date`; backend mewajibkan `return_date` (tanpa ini simpan ditolak 422). */
function toPayload<T extends { date?: string }>({ date, ...rest }: T) {
  return date === undefined ? rest : { ...rest, return_date: date }
}
export const salesReturnApi = {
  list: (params: SalesReturnListParams) =>
    http.get<unknown, PaginatedResponse<SalesReturn>>('/sales/returns', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/sales/returns/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}`),

  create: (payload: CreateSalesReturnPayload) =>
    http.post<unknown, ApiResponse<SalesReturn>>('/sales/returns', toPayload(payload)),

  createFromInvoice: (invoiceId: number) =>
    http.post<unknown, ApiResponse<SalesReturn>>(`/sales/returns/from-invoice/${invoiceId}`),

  createFromDeliveryOrder: (doId: number) =>
    http.post<unknown, ApiResponse<SalesReturn>>(`/sales/returns/from-delivery-order/${doId}`),

  update: (id: number, payload: UpdateSalesReturnPayload) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}`, toPayload(payload)),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<SalesReturn>>(`/sales/returns/${id}/void`, { reason }),

  /** Hapus dokumen (mode lock/open). Tanpa efek dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/sales/returns/${id}`, { data: reason ? { reason } : {} }),
}
