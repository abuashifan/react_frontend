import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  PurchaseReturn,
  RawPurchaseReturn,
  PurchaseReturnListParams,
  CreatePurchaseReturnPayload,
} from '../types/purchaseReturn.types'

export const purchaseReturnApi = {
  list: (params: PurchaseReturnListParams) =>
    http.get<unknown, PaginatedResponse<RawPurchaseReturn>>('/purchase/returns', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<RawPurchaseReturn>>(`/purchase/returns/${id}`),

  create: (payload: CreatePurchaseReturnPayload) =>
    http.post<unknown, ApiResponse<PurchaseReturn>>('/purchase/returns', payload),

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
