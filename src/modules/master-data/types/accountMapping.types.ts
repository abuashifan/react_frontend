import type { CoaType } from './coa.types'

export interface AccountMapping {
  mapping_key: string
  module: string
  label: string | null
  description: string | null
  account_id: number | null
  account_types: CoaType[]
  is_required: boolean
  is_active: boolean
  visible_in_settings: boolean
  settings_section: string | null
  settings_order: number
  account_code: string | null
  account_name: string | null
  account?: {
    id: number
    account_code: string
    account_name: string
    account_type: CoaType
    is_active: boolean
  } | null
}

export interface UpdateAccountMappingPayload {
  account_id: number | null
}

export interface UpdateAccountMappingsPayload {
  mappings: Array<UpdateAccountMappingPayload & { mapping_key: string }>
}
