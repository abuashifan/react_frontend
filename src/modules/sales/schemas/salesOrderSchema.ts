import { z } from 'zod'

export const salesOrderSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  payment_term_id: z.number().nullable().optional(),
  delivery_address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type SalesOrderFormValues = z.infer<typeof salesOrderSchema>
