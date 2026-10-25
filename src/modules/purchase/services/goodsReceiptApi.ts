import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords, SelectOption } from '@/types/common.types'
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

  /** PO yang masih bisa diterima barangnya -- untuk pilihan "Dari Purchase Order" di form GR. */
  searchReceivableOrders: async (query: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<{ id: number; order_number?: string; status: string; vendor?: { name?: string } | null }>>('/purchase/orders', {
      params: { search: query, per_page: 50, page: 1 },
    })
    return res.data
      .filter((po) => ['confirmed', 'partially_received', 'partially_billed', 'billed'].includes(po.status))
      .map((po) => ({ value: po.id, label: po.order_number ?? `PO #${po.id}`, sublabel: po.vendor?.name ?? undefined }))
  },

  createFromPurchaseOrder: (purchaseOrderId: number) =>
    http.post<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/from-purchase-order/${purchaseOrderId}`),

  receive: (id: number) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/receive`),

  cancel: (id: number) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/cancel`),

  /** Edit draft / (mode open) yang sudah diposting -- backend memposting ulang. */
  update: (id: number, payload: CreateGoodsReceiptPayload) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}`, payload),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<GoodsReceipt>>(`/purchase/goods-receipts/${id}/void`, { reason }),

  /** Hapus dokumen (mode lock/open). Tanpa efek dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/purchase/goods-receipts/${id}`, { data: reason ? { reason } : {} }),
}
