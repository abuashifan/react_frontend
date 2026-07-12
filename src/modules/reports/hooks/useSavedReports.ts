import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { savedReportsApi } from '../services/savedReportsApi'
import type { SavedReportInput } from '../types/reports.types'

const SAVED_REPORTS_KEY = ['reports', 'saved'] as const

export function useSavedReports() {
  return useQuery({
    queryKey: SAVED_REPORTS_KEY,
    queryFn: () => savedReportsApi.list(),
  })
}

export function useShareableUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['reports', 'saved', 'shareable-users'],
    queryFn: () => savedReportsApi.shareableUsers(),
    enabled,
  })
}

export function useCreateSavedReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SavedReportInput) => savedReportsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_REPORTS_KEY }),
  })
}

export function useUpdateSavedReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SavedReportInput }) => savedReportsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_REPORTS_KEY }),
  })
}

export function useDeleteSavedReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => savedReportsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_REPORTS_KEY }),
  })
}
