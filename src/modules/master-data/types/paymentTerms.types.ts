export interface PaymentTerms {
  id: number
  name: string
  days: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface CreatePaymentTermsPayload {
  name: string
  days: number
  description?: string
}

export type UpdatePaymentTermsPayload = Partial<CreatePaymentTermsPayload>
