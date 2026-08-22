import { useQuery } from '@tanstack/react-query'
import { budgetApi } from '../services/budgetApi'
import type { BudgetParams } from '../types/budget.types'

export function useProjectFinancials(projectId: number | null, params: BudgetParams) {
  return useQuery({
    queryKey: ['budget', 'project-financials', projectId, params],
    queryFn: () => budgetApi.getProjectSummary(projectId as number, params),
    enabled: !!projectId && !!params.budget_period_id,
  })
}

export function useProjectCashFlow(projectId: number | null, params: BudgetParams) {
  return useQuery({
    queryKey: ['budget', 'project-cash-flow', projectId, params],
    queryFn: () => budgetApi.getProjectCashFlow(projectId as number, params),
    enabled: !!projectId && !!params.budget_period_id,
  })
}

export function useProjectTransactions(
  projectId: number | null,
  params: BudgetParams & { account_id?: number; direction?: 'revenue' | 'expense' },
) {
  return useQuery({
    queryKey: ['budget', 'project-transactions', projectId, params],
    queryFn: () => budgetApi.getProjectTransactions(projectId as number, params),
    enabled: !!projectId && !!params.budget_period_id,
  })
}
