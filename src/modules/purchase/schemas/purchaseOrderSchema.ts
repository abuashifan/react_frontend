import { z } from 'zod'

export const purchaseOrderSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  payment_term_id: z.number().nullable().optional(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.expected_delivery_date && values.date && values.expected_delivery_date < values.date) {
    ctx.addIssue({ code: 'custom', path: ['expected_delivery_date'], message: 'Tanggal pengiriman harus sama atau setelah tanggal PO' })
  }
})

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>
