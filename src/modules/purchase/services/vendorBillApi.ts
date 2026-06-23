import { http } from '@/services/http'
import { adaptPurchaseListRows } from './purchaseListAdapter'
import { adaptPurchaseDocument, adaptPurchasePayload } from './purchaseTransactionAdapter'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  VendorBill,
  VendorBillListParams,
  CreateVendorBillPayload,
  UpdateVendorBillPayload,
} from '../types/vendorBill.types'

const DATE_OPTS = { dateField: 'bill_date', secondaryDateField: 'due_date' }

export const vendorBillApi = {
  list: async (params: VendorBillListParams) => {
    const res = await http.get<unknown, PaginatedResponse<VendorBill>>('/purchase/bills', { params })
    return { ...res, data: adaptPurchaseListRows(res.data, { date: 'bill_date' }) }
  },

  get: async (id: number) => {
    const res = await http.get<unknown, ApiResponse<VendorBill>>(`/purchase/bills/${id}`)
    return { ...res, data: adaptPurchaseDocument<VendorBill>(res.data, DATE_OPTS) }
  },

  create: (payload: CreateVendorBillPayload) =>
    http.post<unknown, ApiResponse<VendorBill>>('/purchase/bills', adaptPurchasePayload(payload, DATE_OPTS)),

  createFromPurchaseOrder: (purchaseOrderId: number) =>
    http.post<unknown, ApiResponse<VendorBill>>(`/purchase/bills/from-purchase-order/${purchaseOrderId}`),

  createFromGoodsReceipt: (goodsReceiptId: number) =>
    http.post<unknown, ApiResponse<VendorBill>>(`/purchase/bills/from-goods-receipt/${goodsReceiptId}`),

  update: (id: number, payload: UpdateVendorBillPayload) =>
    http.patch<unknown, ApiResponse<VendorBill>>(`/purchase/bills/${id}`, adaptPurchasePayload(payload, DATE_OPTS)),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<VendorBill>>(`/purchase/bills/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<VendorBill>>(`/purchase/bills/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<VendorBill>>(`/purchase/bills/${id}/void`, { reason }),
}
