export interface AccountMapping {
  mapping_key: string
  module: string
  label: string | null
  account_id: number | null
  is_required: boolean
  account_code: string | null
  account_name: string | null
  settings_section: string | null
}

export interface UpdateAccountMappingPayload {
  account_id: number | null
}
