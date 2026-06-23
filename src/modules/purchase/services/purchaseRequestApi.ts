import { http } from '@/services/http'
import { adaptPurchaseListRows } from './purchaseListAdapter'
import { adaptPurchaseDocument, adaptPurchasePayload } from './purchaseTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  PurchaseRequest,
  PurchaseRequestListParams,
  CreatePurchaseRequestPayload,
  UpdatePurchaseRequestPayload,
} from '../types/purchaseRequest.types'

const DATE_OPTS = { dateField: 'request_date', secondaryDateField: 'needed_date' }

export const purchaseRequestApi = {
  list: async (params: PurchaseRequestListParams) => {
    const res = await http.get<unknown, PaginatedResponse<PurchaseRequest>>('/purchase/requests', { params })
    return { ...res, data: adaptPurchaseListRows(res.data, { date: 'request_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}`)
    return { ...res, data: adaptPurchaseDocument<PurchaseRequest>(res.data, DATE_OPTS) }
  },

  create: (payload: CreatePurchaseRequestPayload) =>
    http.post<unknown, ApiResponse<PurchaseRequest>>('/purchase/requests', adaptPurchasePayload(payload, DATE_OPTS)),

  update: (id: number, payload: UpdatePurchaseRequestPayload) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}`, adaptPurchasePayload(payload, DATE_OPTS)),

  submit: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/submit`),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/approve`),

  reject: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/reject`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseRequest>>(`/purchase/requests/${id}/cancel`),
}
