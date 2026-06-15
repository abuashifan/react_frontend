import { z } from 'zod'

export const salesReturnSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  notes: z.string().nullable().optional(),
})

export type SalesReturnFormValues = z.infer<typeof salesReturnSchema>
