import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'

export const disbursementPermissions = {
  view: 'cash_bank.workspace_disbursements.view',
  record: 'cash_bank.workspace_disbursements.create',
  review: 'cash_bank.workspace_disbursements.approve',
}

export const qcLabels = { pending: 'Menunggu QC', approved: 'QC disetujui', rejected: 'QC dikembalikan' }
export type QcStatus = keyof typeof qcLabels
export type DisbursementOption = 'cash' | 'expense' | 'department' | 'project'

export interface WorkspaceDisbursementRow {
  id: number
  workspace_document_id: number
  unit_name: string
  title: string
  activity_date: string
  amount_minor: number
  disbursed_on: string | null
  qc_status: QcStatus
  cash_payment: { id: number; payment_number: string; status: 'draft' | 'posted' | 'void'; journal_entry_id: number | null } | null
}

export interface SourceLine {
  id: number
  budget_code: string
  description: string
  amount_minor: number
}

export interface WorkspaceDisbursement extends WorkspaceDisbursementRow {
  source_version: number
  source_lines: SourceLine[]
  payment_reference: string | null
  cash_bank_account_id: number | null
  cash_bank_account: { id: number; account_code: string; account_name: string } | null
  qc_note: string | null
  history: { action: string; created_at: string; user_id: number; details: { note?: string } }[]
  /** Usulan akun dan dimensi dari QC terakhir untuk kode pos yang sama. */
  suggested_lines?: SuggestedLine[]
}

export interface SuggestedLine {
  source_line_id: number
  account: SelectOption<number> | null
  department: SelectOption<number> | null
  project: SelectOption<number> | null
}

interface RecordInput { disbursed_on: string; cash_bank_account_id: number; payment_reference: string }
interface QcInput {
  note?: string
  lines?: { source_line_id: number; account_id: number; department_id?: number | null; project_id?: number | null }[]
}

const root = '/cash-bank/workspace-disbursements'

export const workspaceDisbursementApi = {
  list: (page: number, perPage: number, status?: QcStatus) =>
    http.get<unknown, PaginatedResponse<WorkspaceDisbursementRow>>(root, { params: { page, per_page: perPage, status } }),
  detail: (id: number) => http.get<unknown, ApiResponse<WorkspaceDisbursement>>(root + '/' + id),
  record: (id: number, data: RecordInput) =>
    http.post<unknown, ApiResponse<WorkspaceDisbursement>>(root + '/' + id + '/record', data),
  review: (id: number, decision: 'approve' | 'reject' | 'reopen', data: QcInput) =>
    http.post<unknown, ApiResponse<WorkspaceDisbursement>>(root + '/' + id + '/qc/' + decision, data),
  options: async (type: DisbursementOption, q: string) => {
    const response = await http.get<unknown, ApiResponse<SelectOption<number>[]>>(root + '/options', { params: { type, q } })
    return response.data
  },
}

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const disbursementAmount = (minor: number) => rupiah.format(minor / 100)
