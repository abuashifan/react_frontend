import { http } from '@/services/http'
import { adaptPurchaseListRows } from './purchaseListAdapter'
import { adaptPurchaseDocument, adaptPurchasePayload } from './purchaseTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  GoodsReceipt,
  GoodsReceiptListParams,
  CreateGoodsReceiptPayload,
} from '../types/goodsReceipt.types'

const DATE_OPTS = { dateField: 'receipt_date' }

export const goodsReceiptApi = {
  list: async (params: GoodsReceiptListParams) => {
    const res = await http.get<unknown, PaginatedResponse<GoodsReceipt>>('/purchase/goods-receipts', { params })
    return { ...res, data: adaptPurchaseListRows(res.data, { date: 'receipt_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}`)
    return { ...res, data: adaptPurchaseDocument<GoodsReceipt>(res.data, DATE_OPTS) }
  },

  create: (payload: CreateGoodsReceiptPayload) =>
    http.post<unknown, ApiResponse<GoodsReceipt>>('/purchase/goods-receipts', adaptPurchasePayload(payload, DATE_OPTS)),

  createFromPurchaseOrder: (purchaseOrderId: number) =>
    http.post<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/from-purchase-order/${purchaseOrderId}`),

  receive: (id: number) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/receive`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/cancel`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/void`, { reason }),
}
