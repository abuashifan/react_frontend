import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fiscalYearApi } from '../services/fiscalYearApi'
import { periodLockApi } from '../services/periodLockApi'

const QK = {
  fiscalYearStatus: ['accounting', 'fiscal-year', 'status'] as const,
  periodLockStatus: ['accounting', 'period-locks', 'status'] as const,
}

export function useFiscalYearStatus() {
  return useQuery({ queryKey: QK.fiscalYearStatus, queryFn: () => fiscalYearApi.status() })
}

export function useFiscalYearMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounting', 'fiscal-year'] })

  return {
    close: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: { closing_entry_date?: string; retained_earnings_account_id?: number } }) =>
        fiscalYearApi.close(id, payload),
      onSuccess: invalidate,
    }),
    reopen: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: { reopen_reason: string } }) =>
        fiscalYearApi.reopen(id, payload),
      onSuccess: invalidate,
    }),
  }
}

export function usePeriodLockStatus() {
  return useQuery({ queryKey: QK.periodLockStatus, queryFn: () => periodLockApi.status() })
}

export function usePeriodLockMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['accounting', 'period-locks'] })

  return {
    update: useMutation({
      mutationFn: (payload: { lock_until: string | null; override_reason?: string }) =>
        periodLockApi.update(payload),
      onSuccess: invalidate,
    }),
  }
}
