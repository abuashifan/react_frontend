import { z } from 'zod'

export const salesReceiptSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  cash_bank_account_id: z.number({ message: 'Akun kas/bank wajib dipilih' }),
  amount: z.number().min(1, 'Jumlah pembayaran harus lebih dari 0'),
  notes: z.string().nullable().optional(),
})

export type SalesReceiptFormValues = z.infer<typeof salesReceiptSchema>
