import { z } from 'zod'

export const vendorDepositSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  cash_bank_account_id: z.number({ message: 'Akun kas/bank wajib dipilih' }),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
})

export type VendorDepositFormValues = z.infer<typeof vendorDepositSchema>
