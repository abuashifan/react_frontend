import { z } from 'zod'

export const customerDepositSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  cash_bank_account_id: z.number({ message: 'Akun kas/bank wajib dipilih' }),
  amount: z.number().min(1, 'Jumlah deposit harus lebih dari 0'),
  notes: z.string().nullable().optional(),
})

export type CustomerDepositFormValues = z.infer<typeof customerDepositSchema>
