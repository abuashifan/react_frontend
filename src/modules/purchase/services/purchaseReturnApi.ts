import { http } from '@/services/http'
import { adaptPurchaseListRows } from './purchaseListAdapter'
import { adaptPurchaseDocument, adaptPurchasePayload } from './purchaseTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  PurchaseReturn,
  PurchaseReturnListParams,
  CreatePurchaseReturnPayload,
} from '../types/purchaseReturn.types'

const DATE_OPTS = { dateField: 'return_date' }

export const purchaseReturnApi = {
  list: async (params: PurchaseReturnListParams) => {
    const res = await http.get<unknown, PaginatedResponse<PurchaseReturn>>('/purchase/returns', { params })
    return { ...res, data: adaptPurchaseListRows(res.data, { date: 'return_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<PurchaseReturn>>(`/purchase/returns/${id}`)
    return { ...res, data: adaptPurchaseDocument<PurchaseReturn>(res.data, DATE_OPTS) }
  },

  create: (payload: CreatePurchaseReturnPayload) =>
    http.post<unknown, ApiResponse<PurchaseReturn>>('/purchase/returns', adaptPurchasePayload(payload, DATE_OPTS)),

  createFromBill: (billId: number) =>
    http.post<unknown, ApiResponse<PurchaseReturn>>(`/purchase/returns/from-bill/${billId}`),

  createFromGoodsReceipt: (goodsReceiptId: number) =>
    http.post<unknown, ApiResponse<PurchaseReturn>>(`/purchase/returns/from-goods-receipt/${goodsReceiptId}`),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseReturn>>(`/purchase/returns/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<PurchaseReturn>>(`/purchase/returns/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<PurchaseReturn>>(`/purchase/returns/${id}/void`, { reason }),
}
