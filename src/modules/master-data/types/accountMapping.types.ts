export interface AccountMapping {
  key: string
  label: string
  account_id: number | null
  account?: { id: number; code: string; name: string }
}

export interface UpdateAccountMappingPayload {
  account_id: number | null
}
