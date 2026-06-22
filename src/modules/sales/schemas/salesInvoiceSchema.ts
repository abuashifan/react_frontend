import { z } from 'zod'

export const salesInvoiceSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  due_date: z.string().nullable().optional(),
  payment_term_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.due_date && value.due_date < value.date) {
    ctx.addIssue({ code: 'custom', path: ['due_date'], message: 'Jatuh tempo tidak boleh sebelum tanggal invoice' })
  }
})

export type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>
