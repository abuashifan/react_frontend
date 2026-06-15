import { z } from 'zod'

export const quotationSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  expiry_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type QuotationFormValues = z.infer<typeof quotationSchema>
