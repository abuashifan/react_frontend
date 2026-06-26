import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  RawVendorBill,
  VendorBillListParams,
  CreateVendorBillPayload,
  UpdateVendorBillPayload,
} from '../types/vendorBill.types'

export const vendorBillApi = {
  list: (params: VendorBillListParams) =>
    http.get<unknown, PaginatedResponse<RawVendorBill>>('/purchase/bills', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<RawVendorBill>>(`/purchase/bills/${id}`),

  create: (payload: CreateVendorBillPayload) =>
    http.post<unknown, ApiResponse<RawVendorBill>>('/purchase/bills', payload),

  createFromPurchaseOrder: (purchaseOrderId: number) =>
    http.post<unknown, ApiResponse<RawVendorBill>>(`/purchase/bills/from-purchase-order/${purchaseOrderId}`),

  createFromGoodsReceipt: (goodsReceiptId: number) =>
    http.post<unknown, ApiResponse<RawVendorBill>>(`/purchase/bills/from-goods-receipt/${goodsReceiptId}`),

  update: (id: number, payload: UpdateVendorBillPayload) =>
    http.patch<unknown, ApiResponse<RawVendorBill>>(`/purchase/bills/${id}`, payload),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<RawVendorBill>>(`/purchase/bills/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<RawVendorBill>>(`/purchase/bills/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<RawVendorBill>>(`/purchase/bills/${id}/void`, { reason }),
}
