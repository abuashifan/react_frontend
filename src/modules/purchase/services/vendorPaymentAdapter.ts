import type { RawVendorPayment, VendorPayment } from '../types/vendorPayment.types'

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(parsed) ? parsed : 0
}

export function fromVendorPaymentResponse(raw: RawVendorPayment): VendorPayment {
  return {
    id: raw.id,
    number: raw.payment_number,
    date: raw.payment_date,
    vendor_id: raw.vendor_id,
    vendor: raw.vendor ? { id: raw.vendor.id, code: raw.vendor.contact_code ?? raw.vendor.contact_number ?? raw.vendor.code ?? '', name: raw.vendor.name } : undefined,
    cash_bank_account_id: raw.cash_bank_account_id,
    cash_bank_account: raw.cash_bank_account
      ? { id: raw.cash_bank_account.id, code: raw.cash_bank_account.account_code ?? raw.cash_bank_account.code ?? '', name: raw.cash_bank_account.account_name ?? raw.cash_bank_account.name ?? '' }
      : undefined,
    amount: num(raw.amount),
    notes: raw.notes ?? null,
    status: raw.status,
    lines: (raw.lines ?? []).map((line) => ({
      id: line.id,
      vendor_bill_id: line.vendor_bill_id,
      bill_number: line.vendor_bill?.bill_number,
      amount: num(line.amount),
      balance_due: line.balance_due == null ? undefined : num(line.balance_due),
    })),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export function toVendorPaymentPayload(values: { vendor_id: number; date: string; cash_bank_account_id: number; amount: number; notes?: string | null }) {
  return {
    vendor_id: values.vendor_id,
    payment_date: values.date,
    cash_bank_account_id: values.cash_bank_account_id,
    amount: values.amount,
    notes: values.notes || null,
  }
}