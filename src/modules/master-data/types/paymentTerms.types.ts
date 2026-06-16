export interface PaymentTerms {
  id: number
  code: string
  name: string
  days: number
  is_custom: boolean
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface CreatePaymentTermsPayload {
  code: string
  name: string
  days: number
  is_custom?: boolean
  is_active?: boolean
  sort_order?: number
}

export type UpdatePaymentTermsPayload = Partial<CreatePaymentTermsPayload>
