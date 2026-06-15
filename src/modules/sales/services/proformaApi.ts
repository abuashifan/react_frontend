import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  ProformaInvoice,
  ProformaListParams,
  CreateProformaPayload,
  UpdateProformaPayload,
} from '../types/proforma.types'

export const proformaApi = {
  list: (params: ProformaListParams) =>
    http.get<unknown, PaginatedResponse<ProformaInvoice>>('/sales/proformas', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}`),

  create: (payload: CreateProformaPayload) =>
    http.post<unknown, ApiResponse<ProformaInvoice>>('/sales/proformas', payload),

  createFromSalesOrder: (salesOrderId: number) =>
    http.post<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/from-sales-order/${salesOrderId}`),

  update: (id: number, payload: UpdateProformaPayload) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}`, payload),

  issue: (id: number) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}/issue`),

  accept: (id: number) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}/accept`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<ProformaInvoice>>(`/sales/proformas/${id}/cancel`),
}
