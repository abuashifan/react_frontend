import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  BudgetPeriod,
  BudgetAllocation,
  BudgetAllocationInput,
  BudgetSubmission,
  BudgetSubmissionListRow,
  BudgetSubmissionListParams,
  BudgetConsolidation,
  BudgetComparison,
  BudgetParams,
  BudgetLineInput,
  BudgetAnalysis,
  BudgetAnalysisParams,
  BudgetVersion,
  CashBudget,
  ProjectFinancialSummary,
  ProjectTransactions,
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

  // `name` opsional — kosong berarti BudgetPeriodService generate dari
  // fiscal_year. `department_allocations` opsional — form gabungan pagu+
  // periode mengirim ini sekaligus; backend membuat root (SUM otomatis) +
  // baris per departemen dalam satu transaksi (`createWithAllocations()`).
  createPeriod: (data: {
    name?: string
    fiscal_year: number
    fiscal_year_id?: number | null
    period_from: string
    period_to: string
    department_allocations?: BudgetAllocationInput[]
  }) => http.post<unknown, ApiResponse<BudgetPeriod>>('/budget-periods', data),

  getPeriod: (id: number) =>
    http.get<unknown, ApiResponse<BudgetPeriod>>(`/budget-periods/${id}`),

  updatePeriod: (
    id: number,
    data: Partial<{ name: string; fiscal_year: number; period_from: string; period_to: string }>,
  ) => http.put<unknown, ApiResponse<BudgetPeriod>>(`/budget-periods/${id}`, data),

  closePeriod: (id: number) =>
    http.post<unknown, ApiResponse<BudgetPeriod>>(`/budget-periods/${id}/close`),

  // --- Budget Allocations (pagu top-down, Gap A) ---
  listAllocations: (periodId: number) =>
    http.get<unknown, ApiResponse<BudgetAllocation[]>>(`/budget-periods/${periodId}/allocations`),

  createAllocation: (
    periodId: number,
    data: { department_id: number | null; parent_allocation_id: number | null; amount: number; notes?: string | null },
  ) => http.post<unknown, ApiResponse<BudgetAllocation>>(`/budget-periods/${periodId}/allocations`, data),

  updateAllocation: (id: number, data: { amount?: number; notes?: string | null }) =>
    http.put<unknown, ApiResponse<BudgetAllocation>>(`/budget-allocations/${id}`, data),

  // --- Budget Submissions ---
  // Daftar lintas periode — sumber halaman "Daftar Budget". Terpaginasi di
  // server; jangan disaring ulang di klien.
  listAllSubmissions: (params?: BudgetSubmissionListParams) =>
    http.get<unknown, PaginatedResponse<BudgetSubmissionListRow>>('/budget-submissions', { params }),

  listSubmissions: (periodId: number, params?: { department_id?: number }) =>
    http.get<unknown, ApiResponse<BudgetSubmission[]>>(
      `/budget-periods/${periodId}/submissions`,
      { params },
    ),

  createSubmission: (periodId: number, data: { department_id: number | null; notes?: string }) =>
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

  // --- Versioning (fase 5) ---
  getVersions: (id: number) =>
    http.get<unknown, ApiResponse<BudgetVersion[]>>(`/budget-submissions/${id}/versions`),

  revise: (id: number, revision_reason: string) =>
    http.post<unknown, ApiResponse<BudgetSubmission>>(`/budget-submissions/${id}/revise`, {
      revision_reason,
    }),

  // --- Mesin analisis (fase 6) ---
  // Semua endpoint di bawah ini preset di atas satu service backend; bedanya
  // hanya `group_by`. Report key-nya dipisah karena katalog laporan butuh id
  // diskrit untuk fitur simpan laporan.
  getAnalysis: (params: BudgetAnalysisParams) =>
    http.get<unknown, ApiResponse<BudgetAnalysis>>('/budget/analysis', { params }),

  getSummary: (params: BudgetAnalysisParams) =>
    http.get<unknown, ApiResponse<BudgetAnalysis>>('/budget/summary', { params }),

  getCashBudget: (params: BudgetParams) =>
    http.get<unknown, ApiResponse<CashBudget>>('/budget/cash', { params }),

  getProjectSummary: (projectId: number, params: BudgetParams) =>
    http.get<unknown, ApiResponse<ProjectFinancialSummary>>(
      `/budget/projects/${projectId}/summary`,
      { params },
    ),

  getProjectCashFlow: (projectId: number, params: BudgetParams) =>
    http.get<unknown, ApiResponse<CashBudget>>(`/budget/projects/${projectId}/cash-flow`, {
      params,
    }),

  getProjectTransactions: (
    projectId: number,
    params: BudgetParams & { account_id?: number; direction?: 'revenue' | 'expense' },
  ) =>
    http.get<unknown, ApiResponse<ProjectTransactions>>(
      `/budget/projects/${projectId}/transactions`,
      { params },
    ),

  // --- Reports ---
  getComparison: (params: BudgetParams) =>
    http.get<unknown, ApiResponse<BudgetComparison>>('/reports/budget/comparison', { params }),

  getReport: (
    key: 'by-account' | 'by-cost-center' | 'by-project' | 'by-period' | 'utilization' | 'variance',
    params: BudgetAnalysisParams,
  ) => http.get<unknown, ApiResponse<BudgetAnalysis>>(`/reports/budget/${key}`, { params }),
}
