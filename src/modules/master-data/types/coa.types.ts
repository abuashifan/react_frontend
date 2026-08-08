export type CoaType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface Coa {
  id: number
  account_code: string
  account_name: string
  account_type: CoaType
  parent_account_id: number | null
  parent?: { id: number; account_code: string; account_name: string }
  description: string | null
  normal_balance?: 'debit' | 'credit' | null
  is_cash_bank?: boolean
  is_active: boolean
  level: number
  children?: Coa[]
  created_at: string
  updated_at: string
}

export interface CoaListParams {
  /**
   * Opsional, dan daftar COA sengaja TIDAK mengirimnya — lihat catatan di
   * `CoaListPage`. Backend mengembalikan seluruh baris tanpa paginasi bila
   * `page`/`per_page` tidak dikirim sama sekali (kontrak
   * `AppliesListQuery::applyListQuery()`).
   */
  page?: number
  per_page?: 25 | 50 | 100
  search?: string
  account_type?: CoaType
  is_active?: boolean
  is_cash_bank?: boolean
}

export interface CreateCoaPayload {
  account_code: string
  account_name: string
  account_type: CoaType
  parent_account_id?: number | null
  description?: string
  normal_balance?: 'debit' | 'credit'
  is_cash_bank?: boolean
}

export type UpdateCoaPayload = Partial<CreateCoaPayload>
