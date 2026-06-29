import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'
import type {
  BudgetPeriod,
  BudgetSubmission,
  BudgetConsolidation,
  BudgetComparison,
  BudgetParams,
  BudgetLineInput,
} from '../types/budget.types'

export const budgetApi = {
  // --- Budget Periods ---
  listPeriods: (): Promise<ApiResponse<BudgetPeriod[]>> =>
    http.get('/budget-periods').then((r) => r.data),

  createPeriod: (data: {
    name: string
    fiscal_year: number
    period_from: string
    period_to: string
  }): Promise<ApiResponse<BudgetPeriod>> =>
    http.post('/budget-periods', data).then((r) => r.data),

  getPeriod: (id: number): Promise<ApiResponse<BudgetPeriod>> =>
    http.get(`/budget-periods/${id}`).then((r) => r.data),

  updatePeriod: (
    id: number,
    data: Partial<{ name: string; fiscal_year: number; period_from: string; period_to: string }>,
  ): Promise<ApiResponse<BudgetPeriod>> =>
    http.put(`/budget-periods/${id}`, data).then((r) => r.data),

  closePeriod: (id: number): Promise<ApiResponse<BudgetPeriod>> =>
    http.post(`/budget-periods/${id}/close`).then((r) => r.data),

  // --- Budget Submissions ---
  listSubmissions: (
    periodId: number,
    params?: { department_id?: number },
  ): Promise<ApiResponse<BudgetSubmission[]>> =>
    http.get(`/budget-periods/${periodId}/submissions`, { params }).then((r) => r.data),

  createSubmission: (
    periodId: number,
    data: { department_id: number; notes?: string },
  ): Promise<ApiResponse<BudgetSubmission>> =>
    http.post(`/budget-periods/${periodId}/submissions`, data).then((r) => r.data),

  getSubmission: (id: number): Promise<ApiResponse<BudgetSubmission>> =>
    http.get(`/budget-submissions/${id}`).then((r) => r.data),

  updateSubmission: (
    id: number,
    data: { notes?: string },
  ): Promise<ApiResponse<BudgetSubmission>> =>
    http.put(`/budget-submissions/${id}`, data).then((r) => r.data),

  updateLines: (
    id: number,
    lines: BudgetLineInput[],
  ): Promise<ApiResponse<BudgetSubmission>> =>
    http.put(`/budget-submissions/${id}/lines`, { lines }).then((r) => r.data),

  submit: (id: number): Promise<ApiResponse<BudgetSubmission>> =>
    http.post(`/budget-submissions/${id}/submit`).then((r) => r.data),

  approveHead: (id: number): Promise<ApiResponse<BudgetSubmission>> =>
    http.post(`/budget-submissions/${id}/approve-head`).then((r) => r.data),

  approveFinance: (id: number): Promise<ApiResponse<BudgetSubmission>> =>
    http.post(`/budget-submissions/${id}/approve-finance`).then((r) => r.data),

  reject: (id: number, rejection_note: string): Promise<ApiResponse<BudgetSubmission>> =>
    http.post(`/budget-submissions/${id}/reject`, { rejection_note }).then((r) => r.data),

  // --- Consolidation ---
  getConsolidation: (
    periodId: number,
    params?: { by?: 'department' | 'project' | 'project_department'; department_id?: number; project_id?: number; account_id?: number },
  ): Promise<ApiResponse<BudgetConsolidation>> =>
    http.get(`/budget-periods/${periodId}/consolidation`, { params }).then((r) => r.data),

  // --- Reports ---
  getComparison: (params: BudgetParams): Promise<ApiResponse<BudgetComparison>> =>
    http.get('/reports/budget/comparison', { params }).then((r) => r.data),
}
