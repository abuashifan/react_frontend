export type BudgetPeriodStatus = 'open' | 'closed'
export type BudgetSubmissionStatus = 'draft' | 'submitted' | 'approved_by_head' | 'approved' | 'rejected'

export interface BudgetPeriod {
  id: number
  company_id: number
  name: string
  fiscal_year: number
  period_from: string
  period_to: string
  status: BudgetPeriodStatus
  created_by: number
  submissions_count?: number
  created_at: string
  updated_at: string
}

export interface BudgetLine {
  id: number
  budget_submission_id: number
  account_id: number
  account_code?: string
  account_name?: string
  project_id: number | null
  project_name?: string | null
  period: string | null
  amount: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BudgetSubmission {
  id: number
  company_id: number
  budget_period_id: number
  department_id: number
  department_name?: string
  department?: { id: number; name: string }
  period?: { id: number; name: string }
  status: BudgetSubmissionStatus
  revision_number: number
  submitted_by_id: number | null
  submitted_at: string | null
  approved_by_head_id: number | null
  approved_by_head_at: string | null
  approved_by_finance_id: number | null
  approved_by_finance_at: string | null
  rejected_by_id: number | null
  rejected_at: string | null
  rejection_note: string | null
  notes: string | null
  created_by: number
  lines?: BudgetLine[]
  created_at: string
  updated_at: string
}

export interface BudgetConsolidationAccount {
  account_id: number
  account_name: string
  total_amount: string
}

export interface BudgetConsolidationRow {
  department_id?: number
  department_name?: string
  project_id?: number | null
  project_name?: string | null
  accounts: BudgetConsolidationAccount[]
  total_amount: string
  projects?: BudgetConsolidationRow[]
}

export interface BudgetConsolidation {
  budget_period: { id: number; name: string; fiscal_year: number }
  breakdown_by: 'department' | 'project' | 'project_department'
  rows: BudgetConsolidationRow[]
  grand_total: string
}

export interface BudgetComparisonRow {
  account_id: number
  account_code: string | null
  account_name: string | null
  budget_amount: string
  actual_amount: string
  variance: string
  variance_pct: number | null
  over_budget: boolean
}

export interface BudgetComparison {
  period: { budget_period_id: number; name: string }
  rows: BudgetComparisonRow[]
  totals: {
    budget_amount: string
    actual_amount: string
    variance: string
  }
}

export interface BudgetParams {
  budget_period_id?: number
  department_id?: number
  project_id?: number
  period_from?: string
  period_to?: string
}

export interface BudgetLineInput {
  account_id: number
  project_id?: number | null
  period?: string | null
  amount: number
  notes?: string | null
}
