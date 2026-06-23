import { http } from '@/services/http'
import type { PaginatedResponse } from '@/types/api.types'

export type PurchaseSourceDocumentType = 'purchase_request' | 'purchase_order' | 'goods_receipt' | 'vendor_bill'
export type PurchaseSourceTargetType = 'purchase.orders' | 'purchase.goods-receipts' | 'purchase.bills' | 'purchase.returns'

export interface PurchaseSourceDocumentItem {
  id: number
  target_type: PurchaseSourceTargetType
  source_type: PurchaseSourceDocumentType
  source_id: number
  source_number: string
  number: string
  date: string
  partner_id: number | null
  description?: string | null
  status: string
  header: Record<string, unknown>
  lines: Array<Record<string, unknown> & { id: number; quantity: number; remaining_quantity: number }>
}

export const purchaseSourceDocumentApi = {
  list: async (params: { target_type: PurchaseSourceTargetType; source_type?: PurchaseSourceDocumentType; vendor_id?: number; search?: string }) => {
    const res = await http.get<unknown, PaginatedResponse<Record<string, unknown>>>('/purchase/source-documents', {
      params: { ...params, page: 1, per_page: 50 },
    })
    return {
      ...res,
      data: res.data.map((row) => ({
        ...row,
        id: Number(row.source_id ?? row.id),
        number: String(row.document_number ?? row.source_number ?? ''),
        date: String(row.document_date ?? ''),
      })) as PurchaseSourceDocumentItem[],
    }
  },
}
