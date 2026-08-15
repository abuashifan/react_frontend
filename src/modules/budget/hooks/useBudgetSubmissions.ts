import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetApi } from '../services/budgetApi'
import type { BudgetSubmissionListParams } from '../types/budget.types'

export function useBudgetSubmissionList(params: BudgetSubmissionListParams) {
  return useQuery({
    queryKey: ['budget', 'submissions', params],
    queryFn: () => budgetApi.listAllSubmissions(params),
  })
}

export function useBudgetSubmissionMutations() {
  const qc = useQueryClient()
  // Membuat submission mengubah daftar DAN jumlah pengajuan di daftar periode.
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['budget', 'submissions'] })
    void qc.invalidateQueries({ queryKey: ['budget', 'periods'] })
  }

  const create = useMutation({
    mutationFn: ({ periodId, data }: { periodId: number; data: { department_id: number | null; notes?: string } }) =>
      budgetApi.createSubmission(periodId, data),
    onSuccess: invalidate,
  })

  const revise = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => budgetApi.revise(id, reason),
    onSuccess: invalidate,
  })

  return { create, revise }
}
