import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api.types'

export type PeriodEndStatusCode =
  | 'not_started'
  | 'draft'
  | 'running'
  | 'completed'
  | 'failed'
  | 'reopened'

export interface PeriodEndRun {
  id: number
  period: string
  status: PeriodEndStatusCode
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PeriodEndChecklistItem {
  key: string
  label?: string
  status: 'ok' | 'warning' | 'error' | 'pending' | 'passed' | 'blocking' | 'ready' | 'zero_lines' | 'idempotent' | 'not_applicable' | string
  message?: string | null
  count?: number | null
  blocking?: boolean
}

export interface PeriodEndIssue {
  code: string
  message: string
}

export interface PeriodEndChecklist {
  period: string
  period_year?: number
  period_month?: number
  status: PeriodEndStatusCode
  can_run: boolean
  blocking_errors: PeriodEndIssue[]
  warnings: PeriodEndIssue[]
  items: PeriodEndChecklistItem[]
  routines?: Record<string, unknown>
  accounting_period?: Record<string, unknown> | null
}

export interface PeriodEndStatus {
  period: string
  accounting_period?: Record<string, unknown> | null
  status: PeriodEndStatusCode
  can_run: boolean
  can_reopen: boolean
  run?: PeriodEndRun | null
  checklist?: PeriodEndChecklist | null
}

export const periodEndApi = {
  status: (period: string) =>
    http.get<unknown, ApiResponse<PeriodEndStatus>>('/accounting/period-end/status', {
      params: { period },
    }),

  checklist: (period: string) =>
    http.get<unknown, ApiResponse<PeriodEndChecklist>>('/accounting/period-end/checklist', {
      params: { period },
    }),

  run: (period: string) =>
    http.post<unknown, ApiResponse<PeriodEndRun>>('/accounting/period-end/run', { period }),

  reopen: (period: string, reason: string) =>
    http.post<unknown, ApiResponse<PeriodEndRun>>('/accounting/period-end/reopen', {
      period,
      reason,
    }),
}
