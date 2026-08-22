import { useQuery } from '@tanstack/react-query'
import { budgetApi } from '../services/budgetApi'
import type { BudgetAnalysisParams } from '../types/budget.types'

/**
 * Satu hook untuk seluruh view analisis — yang berbeda antar view hanya
 * `params.group_by`, bukan sumber datanya. Params ikut masuk query key supaya
 * drill-down (group_by lebih panjang + filter induk) ter-cache per kombinasi.
 */
export function useBudgetAnalysis(params: BudgetAnalysisParams | null) {
  return useQuery({
    queryKey: ['budget', 'analysis', params],
    queryFn: () => budgetApi.getAnalysis(params as BudgetAnalysisParams),
    enabled: !!params?.budget_period_id,
  })
}
