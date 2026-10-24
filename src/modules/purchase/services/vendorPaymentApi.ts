import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  VendorPayment,
  RawVendorPayment,
  VendorPaymentListParams,
  CreateVendorPaymentPayload,
  VendorContext,
} from '../types/vendorPayment.types'

export const vendorPaymentApi = {
  list: (params: VendorPaymentListParams) =>
    http.get<unknown, PaginatedResponse<RawVendorPayment>>('/purchase/payments', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/purchase/payments/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<RawVendorPayment>>(`/purchase/payments/${id}`),

  create: (payload: CreateVendorPaymentPayload) =>
    http.post<unknown, ApiResponse<VendorPayment>>('/purchase/payments', payload),

  /**
   * Backend mengirim tagihan terbuka dengan kunci `bill_id`; form membaca
   * `vendor_bill_id`. Tanpa alias ini memilih tagihan tidak menambah baris.
   */
  getVendorContext: async (vendorId: number) => {
    const res = await http.get<unknown, ApiResponse<VendorContext>>('/purchase/payments/vendor-context', { params: { vendor_id: vendorId } })
    const openBills = (res.data?.open_bills ?? []).map((bill) => ({
      ...bill,
      vendor_bill_id: bill.vendor_bill_id ?? (bill as unknown as { bill_id: number }).bill_id,
    }))
    return { ...res, data: { ...res.data, open_bills: openBills } }
  },

  post: (id: number) =>
    http.patch<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}/void`, { reason }),

  /** Edit (mode lock/open): isian lengkap seperti buat baru; yang sudah posted diposting ulang. */
  update: (id: number, payload: CreateVendorPaymentPayload) =>
    http.patch<unknown, ApiResponse<VendorPayment>>(`/purchase/payments/${id}`, payload),

  /** Hapus dokumen (mode lock/open). Draft dihapus permanen; yang sudah berefek di-void lalu disembunyikan. */
  remove: (id: number, reason?: string) =>
    http.delete<unknown, ApiResponse<null>>(`/purchase/payments/${id}`, { data: reason ? { reason } : {} }),
}
