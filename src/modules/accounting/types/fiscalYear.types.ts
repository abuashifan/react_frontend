export type FiscalYearStatus = 'open' | 'closed'

export interface FiscalYear {
  id: number
  year: number
  start_date: string
  end_date: string
  status: FiscalYearStatus
  lock_until?: string | null
  closed_at?: string | null
}

export interface FiscalYearStatusResponse {
  active_fiscal_year: FiscalYear
  lock_until?: string | null
  periods?: Array<{ month: number; year: number; label: string; is_locked: boolean }>
}
