import { z } from 'zod'

const allocationLineSchema = z.object({
  account_id: z.number({ message: 'Akun lawan wajib dipilih' }).positive('Akun lawan wajib dipilih'),
  amount: z.number({ message: 'Jumlah line wajib diisi' }).positive('Jumlah line harus lebih dari 0'),
  description: z.string().optional(),
  department_id: z.number().nullable().optional(),
  project_id: z.number().nullable().optional(),
})

export type CashAllocationLineValues = z.infer<typeof allocationLineSchema>

export const EMPTY_CASH_ALLOCATION_LINE: CashAllocationLineValues = {
  account_id: 0,
  amount: 0,
  description: '',
  department_id: null,
  project_id: null,
}

const cashTransactionFields = {
  cash_bank_account_id: z.number({ message: 'Akun kas/bank wajib dipilih' }).positive('Akun kas/bank wajib dipilih'),
  contact_id: z.number().nullable().optional(),
  currency_code: z.string().length(3, 'Kode mata uang harus 3 karakter'),
  exchange_rate: z.number({ message: 'Kurs wajib diisi' }).positive('Kurs harus lebih dari 0'),
  amount: z.number({ message: 'Jumlah wajib diisi' }).positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
  lines: z.array(allocationLineSchema).min(1, 'Minimal satu alokasi akun wajib diisi'),
}

function validateAllocationTotal(
  values: { amount: number; lines: Array<{ amount: number }> },
  context: z.RefinementCtx,
) {
  const lineTotal = values.lines.reduce((sum, line) => sum + line.amount, 0)
  if (Math.abs(lineTotal - values.amount) > 0.01) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lines'],
      message: 'Total alokasi harus sama dengan jumlah header',
    })
  }
}

export const cashReceiptSchema = z.object({
  receipt_date: z.string().min(1, 'Tanggal wajib diisi'),
  ...cashTransactionFields,
}).superRefine(validateAllocationTotal)

export const cashPaymentSchema = z.object({
  payment_date: z.string().min(1, 'Tanggal wajib diisi'),
  ...cashTransactionFields,
}).superRefine(validateAllocationTotal)

export const bankTransferSchema = z.object({
  transfer_date: z.string().min(1, 'Tanggal wajib diisi'),
  from_cash_bank_account_id: z.number({ message: 'Akun asal wajib dipilih' }).positive('Akun asal wajib dipilih'),
  to_cash_bank_account_id: z.number({ message: 'Akun tujuan wajib dipilih' }).positive('Akun tujuan wajib dipilih'),
  currency_code: z.string().length(3, 'Kode mata uang harus 3 karakter'),
  exchange_rate: z.number({ message: 'Kurs wajib diisi' }).positive('Kurs harus lebih dari 0'),
  amount: z.number({ message: 'Jumlah wajib diisi' }).positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
}).superRefine((values, context) => {
  if (values.from_cash_bank_account_id === values.to_cash_bank_account_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['to_cash_bank_account_id'],
      message: 'Akun tujuan harus berbeda dari akun asal',
    })
  }
})

export const bankReconciliationSchema = z.object({
  cash_bank_account_id: z.number({ message: 'Akun bank wajib dipilih' }).positive('Akun bank wajib dipilih'),
  statement_start_date: z.string().min(1, 'Tanggal awal wajib diisi'),
  statement_end_date: z.string().min(1, 'Tanggal akhir wajib diisi'),
  statement_opening_balance: z.number({ message: 'Saldo awal wajib diisi' }),
  statement_ending_balance: z.number({ message: 'Saldo akhir wajib diisi' }),
  notes: z.string().optional(),
}).superRefine((values, context) => {
  if (values.statement_end_date < values.statement_start_date) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['statement_end_date'],
      message: 'Tanggal akhir tidak boleh sebelum tanggal mulai',
    })
  }
})

export type CashReceiptFormValues = z.infer<typeof cashReceiptSchema>
export type CashPaymentFormValues = z.infer<typeof cashPaymentSchema>
export type BankTransferFormValues = z.infer<typeof bankTransferSchema>
export type BankReconciliationFormValues = z.infer<typeof bankReconciliationSchema>
