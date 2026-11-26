import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'

export const disbursementPermissions = {
  view: 'cash_bank.workspace_disbursements.view',
  record: 'cash_bank.workspace_disbursements.create',
  review: 'cash_bank.workspace_disbursements.approve',
}

/** Posisi kegiatan: tahap yang paling membutuhkan tindakan menentukan statusnya. */
export const stateLabels = {
  not_disbursed: 'Belum dicairkan',
  awaiting_qc: 'Menunggu QC',
  returned: 'QC dikembalikan',
  awaiting_posting: 'Menunggu posting',
  payment_void: 'Kas keluar dibatalkan',
  awaiting_settlement: 'Menunggu penyelesaian dana muka',
  complete: 'Tuntas',
  closed: 'Kegiatan selesai',
} as const
export type DisbursementState = keyof typeof stateLabels

export const trancheStateLabels = {
  awaiting_qc: 'Menunggu QC',
  returned: 'QC dikembalikan',
  awaiting_posting: 'Menunggu posting',
  payment_void: 'Kas keluar dibatalkan',
  awaiting_settlement: 'Menunggu penyelesaian',
  complete: 'Tuntas',
  cancelled: 'Dibatalkan',
} as const
export type TrancheState = keyof typeof trancheStateLabels

export const kindLabels = { direct: 'Biaya langsung', advance: 'Dana muka' } as const
export type TrancheKind = keyof typeof kindLabels
export type DisbursementOption = 'cash' | 'expense' | 'advance' | 'department' | 'project'

interface Totals {
  amount_minor: number
  disbursed_minor: number
  realized_minor: number
  refund_minor: number
  awaiting_minor: number
}

export interface WorkspaceDisbursementRow extends Totals {
  id: number
  workspace_document_id: number
  unit_name: string
  title: string
  activity_date: string
  state: DisbursementState
  closed_at: string | null
  tranche_count: number
}

export interface SourceLine {
  id: number
  budget_code: string
  description: string
  amount_minor: number
  allocated_minor: number
  remaining_minor: number
}

type AccountRef = { id: number; account_code: string; account_name: string }

export interface Tranche {
  id: number
  sequence: number
  kind: TrancheKind
  status: 'active' | 'cancelled'
  state: TrancheState
  amount_minor: number
  lines: { source_line_id: number; amount_minor: number }[]
  disbursed_on: string
  payment_reference: string
  cash_bank_account: AccountRef | null
  qc_status: 'pending' | 'approved' | 'rejected'
  qc_note: string | null
  advance_account: AccountRef | null
  cash_payment: { id: number; payment_number: string; status: 'draft' | 'posted' | 'void' } | null
  journal: { id: number; journal_number: string; journal_date: string; status: string } | null
  settled_on: string | null
  settlement_lines: { source_line_id: number; amount_minor: number; account_id: number | null }[] | null
  refund_minor: number
  settlement_journal: { id: number; journal_number: string; status: string } | null
}

export interface SuggestedLine {
  source_line_id: number
  account: SelectOption<number> | null
  department: SelectOption<number> | null
  project: SelectOption<number> | null
}

export interface WorkspaceDisbursement extends WorkspaceDisbursementRow {
  source_version: number
  source_lines: SourceLine[]
  tranches: Tranche[]
  history: { action: string; created_at: string; user_id: number; tranche_id: number | null; details: { note?: string; tranche?: number } }[]
  /** Usulan akun dan dimensi dari QC terakhir untuk kode pos yang sama. */
  suggested_lines: SuggestedLine[]
  suggested_advance_account: SelectOption<number> | null
}

export interface TrancheInput {
  kind: TrancheKind
  disbursed_on: string
  cash_bank_account_id: number
  payment_reference: string
  lines: { source_line_id: number; amount: number }[]
}

export interface QcInput {
  note?: string
  lines?: { source_line_id: number; account_id: number; department_id?: number | null; project_id?: number | null }[]
  advance_account_id?: number
}

export interface SettlementInput {
  settled_on: string
  refund_cash_bank_account_id: number | null
  note?: string
  lines: { source_line_id: number; amount: number; account_id: number }[]
}

const root = '/cash-bank/workspace-disbursements'
type Response = Promise<ApiResponse<WorkspaceDisbursement>>

export const workspaceDisbursementApi = {
  list: (page: number, perPage: number, state?: DisbursementState) =>
    http.get<unknown, PaginatedResponse<WorkspaceDisbursementRow>>(root, { params: { page, per_page: perPage, state } }),
  detail: (id: number): Response => http.get(root + '/' + id),
  createTranche: (id: number, data: TrancheInput): Response => http.post(root + '/' + id + '/tranches', data),
  updateTranche: (id: number, tranche: number, data: TrancheInput): Response => http.put(root + '/' + id + '/tranches/' + tranche, data),
  cancelTranche: (id: number, tranche: number, note: string): Response => http.post(root + '/' + id + '/tranches/' + tranche + '/cancel', { note }),
  review: (id: number, tranche: number, decision: 'approve' | 'reject' | 'reopen', data: QcInput): Response =>
    http.post(root + '/' + id + '/tranches/' + tranche + '/qc/' + decision, data),
  settle: (id: number, tranche: number, data: SettlementInput): Response => http.post(root + '/' + id + '/tranches/' + tranche + '/settle', data),
  cancelSettlement: (id: number, tranche: number, note: string): Response =>
    http.post(root + '/' + id + '/tranches/' + tranche + '/settlement/cancel', { note }),
  options: async (type: DisbursementOption, q: string) => {
    const response = await http.get<unknown, ApiResponse<SelectOption<number>[]>>(root + '/options', { params: { type, q } })
    return response.data
  },
}

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const disbursementAmount = (minor: number) => rupiah.format(minor / 100)
/** Satuan perseratus → rupiah desimal untuk input dan payload API. */
export const toRupiah = (minor: number) => Math.round(minor) / 100
