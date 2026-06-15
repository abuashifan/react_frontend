import { z } from 'zod'

export const salesInvoiceSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  due_date: z.string().nullable().optional(),
  payment_term_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>
