export type BudgetPeriodStatus = 'open' | 'closed'
export type BudgetSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'approved_by_head'
  | 'approved'
  | 'rejected'
  /** Versi yang sudah digantikan versi berikutnya — tetap terbaca, tidak bisa diubah. */
  | 'superseded'

/**
 * Untuk `revenue`, "melampaui anggaran" berarti target terlampaui — favorable.
 * `BudgetState` sudah memperhitungkannya, jadi `under_budget` selalu berarti
 * kabar baik apa pun arahnya.
 */
export type BudgetState = 'on_budget' | 'under_budget' | 'over_budget' | 'no_budget' | 'no_actual'

/** `mixed` hanya muncul di keluaran analisis saat satu baris mencampur dua arah. */
export type BudgetDirection = 'revenue' | 'expense' | 'mixed'

export type BudgetGroupBy = 'department' | 'project' | 'account' | 'period' | 'direction'

export interface BudgetPeriod {
  id: number
  company_id: number
  name: string
  fiscal_year: number
  period_from: string
  period_to: string
  status: BudgetPeriodStatus
  fiscal_year_id?: number | null
  /** Saldo awal kas manual; null = dihitung dari ledger. */
  beginning_cash_override?: string | null
  created_by: number
  submissions_count?: number
  created_at: string
  updated_at: string
}

/**
 * Pagu top-down (Gap A) — dua tingkat saja: root (`department_id: null`,
 * pagu perusahaan, dihitung otomatis = SUM anaknya, tidak pernah diinput
 * manual) dan anaknya (pagu per departemen). Proyek tidak dapat pagu sendiri
 * (Gap F) — tetap dimensi di `BudgetLine`, bukan di sini.
 */
export interface BudgetAllocation {
  id: number
  budget_period_id: number
  department_id: number | null
  department?: { id: number; code: string; name: string } | null
  parent_allocation_id: number | null
  amount: string
  notes: string | null
  created_by: number
  created_at: string
  updated_at: string
}

export interface BudgetAllocationInput {
  department_id: number
  amount: number
  notes?: string | null
}

export interface BudgetLine {
  id: number
  budget_submission_id: number
  account_id: number
  account_code?: string
  account_name?: string
  /** Dimensi baris, bukan pemilik dokumen — lihat `BudgetSubmission.department_id`. */
  department_id?: number | null
  department_name?: string | null
  project_id: number | null
  project_name?: string | null
  /** 'YYYY-MM'; null = anggaran tahunan. Nama lama kolom ini `period`. */
  period_month?: string | null
  period?: string | null
  /** Diturunkan dari jenis akun saat baris disimpan, tidak pernah diinput. */
  direction?: Exclude<BudgetDirection, 'mixed'>
  amount: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BudgetSubmission {
  id: number
  company_id: number
  budget_period_id: number
  /** null = anggaran tingkat perusahaan (tanpa tahap kepala departemen). */
  department_id: number | null
  parent_submission_id?: number | null
  /** Versi anggaran. Berbeda dari `revision_number`, yang menghitung penolakan. */
  version_no?: number
  /** Versi yang berlaku — tepat satu per (periode, departemen). */
  is_active?: boolean
  revision_reason?: string | null
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
  /** Tidak dikirim = warisi departemen pemilik dokumen; null = lintas departemen. */
  department_id?: number | null
  project_id?: number | null
  period_month?: string | null
  amount: number
  notes?: string | null
}


// --- Mesin analisis (fase 2 & 6) -------------------------------------------

/**
 * Satu baris agregasi. Kunci dimensinya hanya ada bila dimensi itu diminta di
 * `group_by` — `group_by=[account]` tidak mengembalikan `department_id`.
 */
export interface BudgetAnalysisRow {
  account_id?: number | null
  account_code?: string | null
  account_name?: string | null
  department_id?: number | null
  department_name?: string | null
  project_id?: number | null
  project_name?: string | null
  /** null = baris tahunan yang belum dialokasikan ke bulan mana pun. */
  period_month?: string | null
  direction: BudgetDirection
  budget_amount: string
  actual_amount: string
  variance: string
  /** null saat anggaran 0 — jangan tampilkan 0%, itu menyesatkan. */
  variance_pct: number | null
  utilization_pct: number | null
  state: BudgetState
}

export interface BudgetAnalysisMeta {
  group_by: BudgetGroupBy[]
  mode: string
  allocation: string
  version: string
  date_from: string
  date_to: string
  /** Actual dipotong rentang sementara anggaran tetap penuh — beri catatan di UI. */
  is_partial_period: boolean
  submission_ids: number[]
}

export interface BudgetAnalysis {
  period: {
    budget_period_id: number
    name: string
    fiscal_year: number
    period_from: string
    period_to: string
  }
  rows: BudgetAnalysisRow[]
  totals: {
    budget_amount: string
    actual_amount: string
    variance: string
    utilization_pct: number | null
  }
  meta: BudgetAnalysisMeta
}

export interface BudgetAnalysisParams {
  budget_period_id: number
  group_by?: BudgetGroupBy[]
  mode?: 'summary' | 'detail' | 'variance'
  allocation?: 'annual_row' | 'even'
  version?: string
  department_id?: number
  project_id?: number
  account_id?: number
  account_type?: string
  direction?: 'revenue' | 'expense'
  date_from?: string
  date_to?: string
}

export interface BudgetVersion {
  id: number
  version_no: number
  parent_submission_id: number | null
  status: BudgetSubmissionStatus
  is_active: boolean
  revision_number: number
  revision_reason: string | null
  department_id: number | null
  department_name: string | null
  created_by: number | null
  created_at: string | null
  approved_at: string | null
  total_amount: string
}

/**
 * Satu baris di halaman "Daftar Budget". Bukan `BudgetSubmission` penuh —
 * daftar hanya membawa yang ditampilkan, plus `total_amount` dari subquery.
 */
export interface BudgetSubmissionListRow {
  id: number
  budget_period_id: number
  department_id: number | null
  status: BudgetSubmissionStatus
  version_no: number
  is_active: boolean
  revision_number: number
  revision_reason: string | null
  /** null bila submission belum punya baris anggaran sama sekali. */
  total_amount: string | null
  submitted_at: string | null
  created_at: string
  department?: { id: number; code: string; name: string } | null
  period?: { id: number; name: string; fiscal_year: number } | null
}

export interface BudgetSubmissionListParams {
  budget_period_id?: number
  department_id?: number
  status?: BudgetSubmissionStatus
  /** Kirim `false` untuk ikut memunculkan versi lama (`superseded`). */
  is_active?: boolean
  search?: string
  /**
   * String bebas, bukan union — allowlist-nya hidup di `$listSortable`
   * (BudgetSubmissionService) dan kolom di luar itu diabaikan backend. Union di
   * sini memaksa pemanggil meng-`as never` hasil `useListSort` (yang memang
   * mengembalikan `string`) tanpa menambah keamanan apa pun, karena tipe
   * TypeScript tidak ikut terkirim ke server.
   */
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ProjectFinancialBlock {
  revenue: string
  cost: string
  profit: string
  /** null bila revenue 0 — margin tidak terdefinisi, bukan 0%. */
  margin_pct: number | null
}

export interface ProjectFinancialSummary {
  project: { id: number; code: string; name: string; status: string; is_active: boolean }
  period: BudgetAnalysis['period']
  budget: ProjectFinancialBlock
  actual: ProjectFinancialBlock
  variance: { revenue: string; cost: string; profit: string }
  cost_utilization_pct: number | null
  revenue_rows: BudgetAnalysisRow[]
  cost_rows: BudgetAnalysisRow[]
  meta: BudgetAnalysisMeta & { limitation: string }
}

export interface ProjectTransactionLine {
  journal_entry_id: number
  journal_entry_line_id: number
  journal_number: string
  journal_date: string
  description: string | null
  account_id: number
  account_code: string
  account_name: string
  department_id: number | null
  department_name: string | null
  direction: BudgetDirection
  debit: string
  credit: string
  amount: string
  source_type: string | null
  source_number: string | null
  source_module: string | null
}

export interface ProjectTransactions {
  project: { id: number; code: string; name: string }
  period: { budget_period_id: number; name: string }
  filter: {
    date_from: string
    date_to: string
    department_id: number | null
    account_id: number | null
    direction: BudgetDirection | null
  }
  lines: ProjectTransactionLine[]
  totals: { revenue: string; cost: string; net: string }
  total_lines: number
  /** true = melebihi 2000 baris, hanya sebagian yang dikirim — persempit rentang tanggal. */
  truncated: boolean
}

export interface CashBudgetSection {
  section: string
  budgeted_inflow: string
  budgeted_outflow: string
  budgeted_net: string
  actual_inflow: string
  actual_outflow: string
  actual_net: string
}

export interface CashBudget {
  period: BudgetAnalysis['period']
  beginning_cash: string
  beginning_cash_source: 'override' | 'ledger'
  budgeted: { inflow: string; outflow: string; net: string; ending_cash: string }
  actual: { inflow: string; outflow: string; net: string; ending_cash: string }
  sections: CashBudgetSection[]
  inflow_rows: BudgetAnalysisRow[]
  outflow_rows: BudgetAnalysisRow[]
  /** Asumsi akrual — WAJIB ditampilkan, ini bukan proyeksi kas berbasis termin. */
  meta: BudgetAnalysisMeta & { assumption: string }
}
