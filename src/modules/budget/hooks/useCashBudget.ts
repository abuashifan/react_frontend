import { useQuery } from '@tanstack/react-query'
import { budgetApi } from '../services/budgetApi'
import type { BudgetParams } from '../types/budget.types'

export function useCashBudget(params: BudgetParams) {
  return useQuery({
    queryKey: ['budget', 'cash', params],
    queryFn: () => budgetApi.getCashBudget(params),
    enabled: !!params.budget_period_id,
  })
}
