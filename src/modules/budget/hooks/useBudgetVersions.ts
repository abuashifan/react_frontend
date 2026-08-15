import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetApi } from '../services/budgetApi'

export function useBudgetVersions(submissionId: number | undefined) {
  return useQuery({
    queryKey: ['budget', 'versions', submissionId],
    queryFn: () => budgetApi.getVersions(submissionId as number),
    enabled: !!submissionId,
  })
}

/**
 * Revisi membuat submission BARU dan menandai yang lama `superseded`, jadi
 * daftar versi dan detail submission lama sama-sama basi setelah sukses.
 */
export function useBudgetRevision(submissionId: number | undefined) {
  const queryClient = useQueryClient()

  const revise = useMutation({
    mutationFn: (revisionReason: string) =>
      budgetApi.revise(submissionId as number, revisionReason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget', 'versions', submissionId] })
      void queryClient.invalidateQueries({ queryKey: ['budget', 'submission', submissionId] })
      void queryClient.invalidateQueries({ queryKey: ['budget', 'periods'] })
    },
  })

  return { revise }
}
