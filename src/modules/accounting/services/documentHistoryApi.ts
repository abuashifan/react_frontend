import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'

/** Isi dokumen pada satu titik waktu: kolom header + baris-barisnya. */
export interface DocumentSnapshot {
  header?: Record<string, unknown>
  /** Riwayat jurnal lama menyimpan header di kunci ini. */
  journal?: Record<string, unknown>
  lines?: Record<string, unknown>[]
}

export interface DocumentHistoryEntry {
  id: number
  version: number
  document_number: string | null
  edited_by: number | null
  edited_by_name: string | null
  edited_at: string | null
  before: DocumentSnapshot | null
  after: DocumentSnapshot | null
}

/** Nama master data per jenis (`contact`, `product`, `account`, ...) => { id: label }. */
export type DocumentHistoryLabels = Record<string, Record<string, string>>

export const documentHistoryApi = {
  /** Riwayat edit satu dokumen. Hanya untuk peran dengan izin `audit.document_history.view`. */
  show: (documentType: string, id: number) =>
    http.get<unknown, ApiResponse<{ entries: DocumentHistoryEntry[]; labels: DocumentHistoryLabels }>>(
      `/accounting/document-history/${documentType}/${id}`,
    ),
}
