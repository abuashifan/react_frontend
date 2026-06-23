import { http } from '@/services/http'
import { adaptPurchaseListRows } from './purchaseListAdapter'
import { adaptPurchaseDocument, adaptPurchasePayload } from './purchaseTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  PurchaseOrder,
  PurchaseOrderListParams,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from '../types/purchaseOrder.types'

const DATE_OPTS = { dateField: 'order_date', secondaryDateField: 'expected_date', secondaryDateUiField: 'expected_delivery_date', secondaryDateSourceField: 'expected_delivery_date' }

export const purchaseOrderApi = {
  list: async (params: PurchaseOrderListParams) => {
    const res = await http.get<unknown, PaginatedResponse<PurchaseOrder>>('/purchase/orders', { params })
    return { ...res, data: adaptPurchaseListRows(res.data, { date: 'order_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}`)
    return { ...res, data: adaptPurchaseDocument<PurchaseOrder>(res.data, DATE_OPTS) }
  },

  create: (payload: CreatePurchaseOrderPayload) =>
    http.post<unknown, ApiResponse<PurchaseOrder>>('/purchase/orders', adaptPurchasePayload(payload, DATE_OPTS)),

  createFromRequest: (purchaseRequestId: number) =>
    http.post<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/from-request/${purchaseRequestId}`),

  update: (id: number, payload: UpdatePurchaseOrderPayload) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}`, adaptPurchasePayload(payload, DATE_OPTS)),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/approve`),

  confirm: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/confirm`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/cancel`),

  close: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/close`),
}
