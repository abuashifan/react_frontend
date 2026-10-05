export interface AccountMapping {
  mapping_key: string
  module: string
  label: string | null
  account_id: number | null
  is_required: boolean
  account_code: string | null
  account_name: string | null
  account_types: string[]
  settings_section: string | null
}

export interface UpdateAccountMappingPayload {
  account_id: number | null
}

/** Kontrak `POST /master-data/account-mappings/import` -- lihat AccountMappingStorageService::importFromFile(). */
export interface AccountMappingImportRow {
  row: number
  mapping_key: string
  status: 'applied' | 'skipped' | 'error'
  account_code: string | null
  message: string | null
}

export interface AccountMappingImportResult {
  results: AccountMappingImportRow[]
  applied_count: number
  skipped_count: number
  error_count: number
}
