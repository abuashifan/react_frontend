import { http } from '@/services/http'
import type { PaginatedResponse } from '@/types/api.types'

export type SourceDocumentType = 'sales_quotation' | 'sales_order' | 'delivery_order' | 'proforma_invoice' | 'sales_invoice'
export type SourceTargetType = 'sales.orders' | 'sales.delivery-orders' | 'sales.proformas' | 'sales.invoices' | 'sales.returns'

export interface SourceDocumentItem {
  id: number
  target_type: SourceTargetType
  source_type: SourceDocumentType
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

export const sourceDocumentApi = {
  list: async (params: { target_type: SourceTargetType; source_type?: SourceDocumentType; customer_id?: number; search?: string }) => {
    const res = await http.get<unknown, PaginatedResponse<Record<string, unknown>>>('/sales/source-documents', {
      params: { ...params, page: 1, per_page: 50 },
    })
    return {
      ...res,
      data: res.data.map((row) => ({
        ...row,
        id: Number(row.source_id ?? row.id),
        number: String(row.document_number ?? row.source_number ?? ''),
        date: String(row.document_date ?? ''),
      })) as SourceDocumentItem[],
    }
  },
}
