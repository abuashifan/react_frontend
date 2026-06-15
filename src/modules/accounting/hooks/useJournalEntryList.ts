import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { journalEntryApi } from '../services/journalEntryApi'
import type { JournalEntryListParams, CreateJournalEntryPayload, UpdateJournalEntryPayload } from '../types/journalEntry.types'

const QK = {
  list: (p: JournalEntryListParams) => ['accounting', 'journals', p] as const,
  detail: (id: number) => ['accounting', 'journals', id] as const,
}

export function useJournalEntryList(params: JournalEntryListParams) {
  return useQuery({ queryKey: QK.list(params), queryFn: () => journalEntryApi.list(params) })
}

export function useJournalEntry(id?: number) {
  return useQuery({
    queryKey: QK.detail(id!),
    queryFn: () => journalEntryApi.get(id!),
    enabled: !!id,
  })
}

export function useJournalEntryMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounting', 'journals'] })

  return {
    create: useMutation({ mutationFn: (p: CreateJournalEntryPayload) => journalEntryApi.create(p), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateJournalEntryPayload }) => journalEntryApi.update(id, payload), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (id: number) => journalEntryApi.approve(id), onSuccess: invalidate }),
    post: useMutation({ mutationFn: (id: number) => journalEntryApi.post(id), onSuccess: invalidate }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => journalEntryApi.void(id, reason), onSuccess: invalidate }),
  }
}
