// Company settings
export interface CompanySettingsData {
  name: string
  legal_name?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  npwp?: string | null
  currency: string
  fiscal_year_start: number
  logo?: string | null
}

// Transaction settings
export interface ApprovalRequired {
  sales_quotation: boolean
  sales_order: boolean
  sales_invoice: boolean
  purchase_request: boolean
  purchase_order: boolean
  vendor_bill: boolean
  stock_adjustment: boolean
  manual_journal: boolean
}

export interface NumberFormat {
  sales_invoice: string
  sales_order: string
  delivery_order: string
  purchase_order: string
  vendor_bill: string
  goods_receipt: string
  manual_journal: string
}

export interface TransactionSettings {
  auto_post_enabled: boolean
  approval_required: ApprovalRequired
  number_formats: NumberFormat
  session_timeout_minutes: number
}

// Users
export interface SettingsUser {
  id: number
  name: string
  email: string
  role?: string | null
  is_active: boolean
  last_login_at?: string | null
  created_at: string
}

export interface CreateUserPayload {
  name: string
  email: string
  role_id?: number | null
  password: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role_id?: number | null
  password?: string
}

// Roles
export interface SettingsRole {
  id: number
  name: string
  description?: string | null
  permissions_count?: number
  permissions?: string[]
}

// Preferences
export interface UserPreferences {
  language: 'id' | 'en'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  number_format: '1.000,00' | '1,000.00'
}
