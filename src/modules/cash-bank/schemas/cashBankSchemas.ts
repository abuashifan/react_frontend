import { z } from 'zod'

export const cashReceiptSchema = z.object({
  receipt_date: z.string().min(1, 'Tanggal wajib diisi'),
  cash_bank_account_id: z.number({ message: 'Akun kas/bank wajib dipilih' }),
  contact_id: z.number().nullable().optional(),
  amount: z.number({ message: 'Jumlah wajib diisi' }).positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
})

export const cashPaymentSchema = z.object({
  payment_date: z.string().min(1, 'Tanggal wajib diisi'),
  cash_bank_account_id: z.number({ message: 'Akun kas/bank wajib dipilih' }),
  contact_id: z.number().nullable().optional(),
  amount: z.number({ message: 'Jumlah wajib diisi' }).positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
})

export const bankTransferSchema = z.object({
  transfer_date: z.string().min(1, 'Tanggal wajib diisi'),
  from_cash_bank_account_id: z.number({ message: 'Akun asal wajib dipilih' }),
  to_cash_bank_account_id: z.number({ message: 'Akun tujuan wajib dipilih' }),
  amount: z.number({ message: 'Jumlah wajib diisi' }).positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
})

export const bankReconciliationSchema = z.object({
  cash_bank_account_id: z.number({ message: 'Akun bank wajib dipilih' }),
  statement_start_date: z.string().min(1, 'Tanggal awal wajib diisi'),
  statement_end_date: z.string().min(1, 'Tanggal akhir wajib diisi'),
  statement_ending_balance: z.number({ message: 'Saldo akhir wajib diisi' }),
  notes: z.string().optional(),
})

export type CashReceiptFormValues = z.infer<typeof cashReceiptSchema>
export type CashPaymentFormValues = z.infer<typeof cashPaymentSchema>
export type BankTransferFormValues = z.infer<typeof bankTransferSchema>
export type BankReconciliationFormValues = z.infer<typeof bankReconciliationSchema>
