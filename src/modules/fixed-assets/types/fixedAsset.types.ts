import type { ListParams } from '@/types/api.types'

export type AmountValue = number | string | null

export type FixedAssetStatus =
  | 'draft'
  | 'capitalized'
  | 'active'
  | 'fully_depreciated'
  | 'partially_disposed'
  | 'disposed'

export type FixedAssetClass = 'tangible' | 'intangible'
export type DepreciationType = 'depreciation' | 'amortization' | 'none' | 'impairment_only'
export type UsefulLifeYears = 4 | 8 | 10 | 16 | 20
export type DisposalType = 'sale' | 'write_off' | 'scrap' | 'lost'

export interface AccountSummary {
  id: number
  account_code?: string
  account_name?: string
  name?: string
}

export interface FixedAssetJournalReference {
  id: number
  journal_number?: string | null
  status?: string | null
  journal_date?: string | null
}

export interface FixedAssetAcquisitionRecord {
  id: number
  source_type?: string | null
  source_id?: number | null
  source_line_id?: number | null
  vendor_id?: number | null
  acquisition_date?: string | null
  quantity?: AmountValue
  amount?: AmountValue
  capitalized_amount?: AmountValue
  journal_entry_id?: number | null
  journal_entry?: FixedAssetJournalReference | null
}

export interface FixedAssetScheduleRecord {
  id: number
  period?: string | null
  status?: string | null
  depreciation_amount?: AmountValue
  accumulated_depreciation_after?: AmountValue
  net_book_value_after?: AmountValue
  journal_entry_id?: number | null
  journal_entry?: FixedAssetJournalReference | null
}

export interface FixedAssetDisposalRecord {
  id: number
  disposal_number?: string | null
  disposal_date?: string | null
  disposal_type?: DisposalType | string | null
  disposed_quantity?: AmountValue
  disposal_net_book_value?: AmountValue
  proceeds_amount?: AmountValue
  gain_loss_amount?: AmountValue
  journal_entry_id?: number | null
  journal_entry?: FixedAssetJournalReference | null
}

export interface FixedAssetTransactionRecord {
  id: number
  transaction_type?: string | null
  transaction_date?: string | null
  period?: string | null
  amount?: AmountValue
  quantity?: AmountValue
  source_type?: string | null
  source_id?: number | null
  journal_entry_id?: number | null
  journal_entry?: FixedAssetJournalReference | null
}

export interface FixedAssetCategory {
  id: number
  code: string
  name: string
  asset_class: FixedAssetClass
  depreciation_type: DepreciationType
  default_useful_life_years?: UsefulLifeYears | null
  asset_account_id?: number | null
  accumulated_depreciation_account_id?: number | null
  depreciation_expense_account_id?: number | null
  clearing_account_id?: number | null
  disposal_gain_account_id?: number | null
  disposal_loss_account_id?: number | null
  is_active: boolean
  asset_account?: AccountSummary | null
  accumulated_depreciation_account?: AccountSummary | null
  depreciation_expense_account?: AccountSummary | null
  clearing_account?: AccountSummary | null
  disposal_gain_account?: AccountSummary | null
  disposal_loss_account?: AccountSummary | null
  created_at?: string
  updated_at?: string
}

export interface FixedAsset {
  id: number
  asset_number?: string | null
  number?: string
  name: string
  description?: string | null
  fixed_asset_category_id: number
  category?: FixedAssetCategory | null
  asset_class?: FixedAssetClass | null
  depreciation_type?: DepreciationType | null
  depreciation_method?: string | null
  status: FixedAssetStatus
  acquisition_date: string
  service_start_date?: string | null
  first_depreciation_period?: string | null
  last_depreciation_period?: string | null
  useful_life_years?: UsefulLifeYears | null
  useful_life_months?: number | null
  quantity?: number | string | null
  remaining_quantity?: number | string | null
  acquisition_cost: AmountValue
  salvage_value?: AmountValue
  depreciable_basis?: AmountValue
  accumulated_depreciation?: AmountValue
  net_book_value?: AmountValue
  department_id?: number | null
  project_id?: number | null
  department?: { id: number; name: string; code?: string | null } | null
  project?: { id: number; name: string; code?: string | null } | null
  source_type?: string | null
  source_id?: number | null
  capitalized_at?: string | null
  disposed_at?: string | null
  acquisitions?: FixedAssetAcquisitionRecord[]
  schedules?: FixedAssetScheduleRecord[]
  disposals?: FixedAssetDisposalRecord[]
  transactions?: FixedAssetTransactionRecord[]
  created_at?: string
  updated_at?: string
}

export interface FixedAssetListParams extends Partial<ListParams> {
  status?: FixedAssetStatus | ''
  category_id?: number | null
  asset_class?: FixedAssetClass | ''
}

export interface CreateFixedAssetPayload {
  name: string
  description?: string | null
  fixed_asset_category_id: number
  acquisition_date: string
  acquisition_cost: number
  service_start_date?: string | null
  useful_life_years?: UsefulLifeYears | null
  quantity?: number | null
  salvage_value?: number | null
  department_id?: number | null
  project_id?: number | null
  source_type?: string | null
  source_id?: number | null
}

export type UpdateFixedAssetPayload = Partial<CreateFixedAssetPayload>

export interface CreateFixedAssetCategoryPayload {
  code: string
  name: string
  asset_class: FixedAssetClass
  depreciation_type: DepreciationType
  default_useful_life_years?: UsefulLifeYears | null
  asset_account_id?: number | null
  accumulated_depreciation_account_id?: number | null
  depreciation_expense_account_id?: number | null
  clearing_account_id?: number | null
  disposal_gain_account_id?: number | null
  disposal_loss_account_id?: number | null
  is_active?: boolean
}

export type UpdateFixedAssetCategoryPayload = Partial<CreateFixedAssetCategoryPayload>

export interface CapitalizeFixedAssetPayload {
  capitalization_date?: string | null
  source_type?: string | null
  source_id?: number | null
  source_line_id?: number | null
  vendor_id?: number | null
  amount?: number | null
}

export interface DisposeFixedAssetPayload {
  disposal_date: string
  disposal_type: DisposalType
  disposed_quantity: number
  proceeds_amount?: number | null
  cash_bank_account_id?: number | null
  receivable_account_id?: number | null
}

export interface FixedAssetReportParams {
  as_of_period?: string
  period_from?: string
  period_to?: string
  mode?: 'detail' | 'yearly_summary'
  disposal_date_from?: string
  disposal_date_to?: string
}

export interface FixedAssetReportRow {
  id?: number | string
  asset_number?: string | null
  name?: string | null
  category?: string | null
  period?: string | null
  acquisition_cost?: AmountValue
  accumulated_depreciation?: AmountValue
  net_book_value?: AmountValue
  depreciation_amount?: AmountValue
  disposal_date?: string | null
  disposal_type?: string | null
  proceeds_amount?: AmountValue
  gain_loss?: AmountValue
  [key: string]: unknown
}

export type FixedAssetReportData = FixedAssetReportRow[] | Record<string, unknown>
