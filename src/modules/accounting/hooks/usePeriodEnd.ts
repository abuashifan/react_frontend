import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { periodEndApi } from '../services/periodEndApi'

const QK = {
  root: ['accounting', 'period-end'] as const,
  status: (period: string) => ['accounting', 'period-end', period, 'status'] as const,
  checklist: (period: string) => ['accounting', 'period-end', period, 'checklist'] as const,
}

export function usePeriodEndStatus(period: string) {
  return useQuery({
    queryKey: QK.status(period),
    queryFn: () => periodEndApi.status(period),
    enabled: Boolean(period),
  })
}

export function usePeriodEndChecklist(period: string) {
  return useQuery({
    queryKey: QK.checklist(period),
    queryFn: () => periodEndApi.checklist(period),
    enabled: Boolean(period),
  })
}

export function usePeriodEndMutations(period: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QK.root })

  return {
    run: useMutation({
      mutationFn: () => periodEndApi.run(period),
      onSuccess: invalidate,
    }),
    reopen: useMutation({
      mutationFn: (reason: string) => periodEndApi.reopen(period, reason),
      onSuccess: invalidate,
    }),
  }
}
