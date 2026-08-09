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

// Tipe hasil ditaruh di generic kedua http.*, bukan sebagai anotasi return.
// Tanpa generic, axios memberi `any` dan anotasi return apa pun akan lolos
// type checker — itu yang dulu menyembunyikan unwrap ganda di seluruh file ini.
// Interceptor http.ts sudah mengembalikan response.data, jadi hasil http.*
// dipakai langsung — jangan meng-unwrap sekali lagi di service.
export const budgetApi = {
  // --- Budget Periods ---
  listPeriods: () =>
    http.get<unknown, ApiResponse<BudgetPeriod[]>>('/budget-periods'),

  createPeriod: (data: {
    name: string
    fiscal_year: number
    period_from: string
    period_to: string
  }) => http.post<unknown, ApiResponse<BudgetPeriod>>('/budget-periods', data),

  getPeriod: (id: number) =>
    http.get<unknown, ApiResponse<BudgetPeriod>>(`/budget-periods/${id}`),

  updatePeriod: (
    id: number,
    data: Partial<{ name: string; fiscal_year: number; period_from: string; period_to: string }>,
  ) => http.put<unknown, ApiResponse<BudgetPeriod>>(`/budget-periods/${id}`, data),

  closePeriod: (id: number) =>
    http.post<unknown, ApiResponse<BudgetPeriod>>(`/budget-periods/${id}/close`),

  // --- Budget Submissions ---
  listSubmissions: (periodId: number, params?: { department_id?: number }) =>
    http.get<unknown, ApiResponse<BudgetSubmission[]>>(
      `/budget-periods/${periodId}/submissions`,
      { params },
    ),

  createSubmission: (periodId: number, data: { department_id: number; notes?: string }) =>
    http.post<unknown, ApiResponse<BudgetSubmission>>(
      `/budget-periods/${periodId}/submissions`,
      data,
    ),

  getSubmission: (id: number) =>
    http.get<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}`),

  updateSubmission: (id: number, data: { notes?: string }) =>
    http.put<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}`, data),

  updateLines: (id: number, lines: BudgetLineInput[]) =>
    http.put<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}/lines`, { lines }),

  submit: (id: number) =>
    http.post<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}/submit`),

  approveHead: (id: number) =>
    http.post<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}/approve-head`),

  approveFinance: (id: number) =>
    http.post<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}/approve-finance`),

  reject: (id: number, rejection_note: string) =>
    http.post<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}/reject`, {
      rejection_note,
    }),

  // --- Consolidation ---
  getConsolidation: (
    periodId: number,
    params?: {
      by?: 'department' | 'project' | 'project_department'
      department_id?: number
      project_id?: number
      account_id?: number
    },
  ) =>
    http.get<unknown, ApiResponse<BudgetConsolidation>>(
      `/budget-periods/${periodId}/consolidation`,
      { params },
    ),

  // --- Reports ---
  getComparison: (params: BudgetParams) =>
    http.get<unknown, ApiResponse<BudgetComparison>>('/reports/budget/comparison', { params }),
}
