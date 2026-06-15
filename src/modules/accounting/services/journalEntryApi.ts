import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  JournalEntry,
  JournalEntryListParams,
  CreateJournalEntryPayload,
  UpdateJournalEntryPayload,
} from '../types/journalEntry.types'

export const journalEntryApi = {
  list: (params: JournalEntryListParams) =>
    http.get<unknown, PaginatedResponse<JournalEntry>>('/journals', { params }),

  get: (id: number) =>
    http.get<unknown, ApiResponse<JournalEntry>>(`/journals/${id}`),

  create: (payload: CreateJournalEntryPayload) =>
    http.post<unknown, ApiResponse<JournalEntry>>('/journals', payload),

  update: (id: number, payload: UpdateJournalEntryPayload) =>
    http.patch<unknown, ApiResponse<JournalEntry>>(`/journals/${id}`, payload),

  approve: (id: number) =>
    http.patch<unknown, ApiResponse<JournalEntry>>(`/journals/${id}/approve`),

  post: (id: number) =>
    http.patch<unknown, ApiResponse<JournalEntry>>(`/journals/${id}/post`),

  void: (id: number, reason: string) =>
    http.patch<unknown, ApiResponse<JournalEntry>>(`/journals/${id}/void`, { reason }),
}
