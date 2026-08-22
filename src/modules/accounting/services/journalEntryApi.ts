import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { AdjacentRecords } from '@/types/common.types'
import type {
  JournalEntry,
  JournalEntryListParams,
  CreateJournalEntryPayload,
  UpdateJournalEntryPayload,
} from '../types/journalEntry.types'

export const journalEntryApi = {
  list: (params: JournalEntryListParams) =>
    http.get<unknown, PaginatedResponse<JournalEntry>>('/journals', { params }),

  /** Tetangga record untuk navigasi Prev/Next di form — hanya id + label. */
  adjacent: (id?: number) =>
    http.get<unknown, ApiResponse<AdjacentRecords>>('/journals/adjacent', { params: { id } }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<JournalEntry>>(`/journals/${id}`),

  create: (payload: CreateJournalEntryPayload) =>
    http.post<unknown, ApiResponse<JournalEntry>>('/journals', payload),

  update: (id: number, payload: UpdateJournalEntryPayload) =>
    http.patch<unknown, ApiResponse<JournalEntry>>(`/journals/${id}`, payload),

  approve: (id: number) =>
    http.post<unknown, ApiResponse<JournalEntry>>(`/journals/${id}/approve`),

  post: (id: number) =>
    http.post<unknown, ApiResponse<JournalEntry>>(`/journals/${id}/post`),

  void: (id: number, reason: string) =>
    http.post<unknown, ApiResponse<JournalEntry>>(`/journals/${id}/void`, { reason }),
}
