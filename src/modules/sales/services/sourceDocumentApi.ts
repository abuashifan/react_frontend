import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'

export type SourceDocumentType = 'sales_order' | 'delivery_order' | 'proforma'

export interface SourceDocumentItem {
  id: number
  type: SourceDocumentType
  number: string
  date: string
  customer_id: number
  customer_name: string
  grand_total: number
  status: string
}

export const sourceDocumentApi = {
  list: (params: { type?: SourceDocumentType; customer_id?: number; search?: string }) =>
    http.get<unknown, ApiResponse<SourceDocumentItem[]>>('/sales/source-documents', { params }),

  availability: (params: { type?: SourceDocumentType; customer_id?: number }) =>
    http.get<unknown, ApiResponse<SourceDocumentItem[]>>('/sales/source-documents/availability', { params }),
}
