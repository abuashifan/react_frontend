/**
 * Kontrak `/api/setup/*` — lihat app/Modules/Setup/Services/SetupWizardService.php.
 * Backend adalah satu-satunya sumber kebenaran status setup awal perusahaan.
 */

export type SetupStatusValue =
  | 'not_started'
  | 'in_progress'
  | 'ready_to_finalize'
  | 'finalized'
  | 'reopened'

export type SetupStepKey =
  | 'company_profile'
  | 'module_selection'
  | 'accounting_settings'
  | 'chart_of_accounts'
  | 'account_mappings'
  | 'opening_fixed_assets'
  | 'opening_balance_preview'
  | 'final_review'
  | 'finalized'

export interface SetupState {
  id: number
  company_id: number
  status: SetupStatusValue
  current_step: SetupStepKey
  opening_date: string | null
  completed_steps: SetupStepKey[]
  validation_errors: Record<string, string[]>
  last_validated_at: string | null
  finalized_at: string | null
  finalized_by: number | null
  reopened_at: string | null
  reopened_by: number | null
}

export interface SetupStep {
  key: SetupStepKey
  order: number
  active: boolean
  skipped: boolean
  completed: boolean
  current: boolean
  errors: string[]
}

/**
 * Ringkasan keputusan dari backend: boleh atau tidak menampilkan alur setup
 * awal. `initial_setup_available` bernilai true hanya saat setup belum
 * difinalisasi DAN buku perusahaan masih kosong.
 */
export interface SetupGate {
  is_finalized: boolean
  has_operational_data: boolean
  initial_setup_available: boolean
}

export interface SetupStatus {
  state: SetupState
  steps: SetupStep[]
  gate: SetupGate
}

/** Kontrak `/api/setup/coa-templates` -- lihat CoaTemplateService::templates(). */
export type CoaAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface CoaTemplateAccountInput {
  code: string
  name: string
  type: CoaAccountType
  parent_code: string | null
  is_cash_bank?: boolean
  description?: string | null
}

export interface CoaTemplateDef {
  id: string
  label: string
  description: string
  account_count: number
  accounts: CoaTemplateAccountInput[]
}
