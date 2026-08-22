import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  GoodsReceipt,
  RawGoodsReceipt,
  GoodsReceiptListParams,
  CreateGoodsReceiptPayload,
} from '../types/goodsReceipt.types'

export const goodsReceiptApi = {
  list: (params: GoodsReceiptListParams) =>
    http.get<unknown, PaginatedResponse<RawGoodsReceipt>>('/purchase/goods-receipts', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/purchase/goods-receipts/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<RawGoodsReceipt>>(`/purchase/goods-receipts/${id}`),

  create: (payload: CreateGoodsReceiptPayload) =>
    http.post<unknown, ApiResponse<GoodsReceipt>>('/purchase/goods-receipts', payload),

  createFromPurchaseOrder: (purchaseOrderId: number) =>
    http.post<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/from-purchase-order/${purchaseOrderId}`),

  receive: (id: number) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/receive`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/cancel`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/void`, { reason }),
}
