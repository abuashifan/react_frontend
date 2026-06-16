// Company settings — mengikuti backend aktual (CompanySettingService + request rules).
// Phase 9 — spec-27 / gap-02. User/Role/Invitation types pindah ke access.types.ts.

export type RoundingMethod = 'half_up' | 'half_down' | 'bankers' | 'floor' | 'ceil'
export type WorkflowMode = 'simple_auto_post' | 'draft_then_post' | 'draft_approve_post'
export type UserPermissionMode = 'role_template' | 'manual_per_user'

export interface CompanyAccountingSettings {
  base_currency?: string
  default_payment_term_id?: number | null
  amount_precision?: number
  quantity_precision?: number
  rounding_method?: RoundingMethod
  transaction_workflow_mode?: WorkflowMode
  auto_post_transactions?: boolean
  allow_edit_transactions?: boolean
  allow_edit_posted_transactions?: boolean
  allow_void_transactions?: boolean
  hide_voided_transactions?: boolean
  require_void_reason?: boolean
  approval_enabled?: boolean
  tax_enabled?: boolean
  user_permission_mode?: UserPermissionMode
  block_outside_current_fiscal_year?: boolean
  date_warning_enabled?: boolean
  allow_backdated_transactions?: boolean
  max_backdate_days?: number
  allow_future_transactions?: boolean
  max_future_days?: number
}

export interface CompanyModuleSettings {
  sales_enabled?: boolean
  purchase_enabled?: boolean
  cash_bank_enabled?: boolean
  inventory_enabled?: boolean
  warehouse_enabled?: boolean
  fixed_asset_enabled?: boolean
  approval_enabled?: boolean
  tax_enabled?: boolean
  reports_enabled?: boolean
}

export interface CompanyTransactionDefaults {
  default_payment_term_id?: number | null
}

export interface CompanySettingsResponse {
  accounting: CompanyAccountingSettings
  transaction_defaults: CompanyTransactionDefaults
  modules: CompanyModuleSettings
}

export interface CompanyWorkflowSettings {
  transaction_workflow_mode: WorkflowMode
  auto_post_transactions: boolean
  approval_enabled: boolean
  allow_void_transactions: boolean
}
