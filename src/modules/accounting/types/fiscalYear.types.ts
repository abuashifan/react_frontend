export type FiscalYearStatus = 'open' | 'closed'

export interface FiscalYear {
  id: number
  year: number
  start_date: string
  end_date: string
  status: FiscalYearStatus
  is_active?: boolean
  is_closed?: boolean
  /** Canonical backend: tanggal lock periode aktif (sebelumnya keliru dibaca `lock_until`). */
  locked_until?: string | null
  closed_at?: string | null
}

export interface FiscalYearStatusResponse {
  active_fiscal_year: FiscalYear
  closing_required?: boolean
}

export interface FiscalYearClosingPreview {
  valid: boolean
  errors: Record<string, string[]>
  warnings: string[]
  preview: {
    fiscal_year: { id: number; year: number; start_date: string; end_date: string; status: string; is_closed: boolean }
    net_profit_loss: number
    journal_count: number
    warning_count: number
    warnings: string[]
    can_close: boolean
  }
}
