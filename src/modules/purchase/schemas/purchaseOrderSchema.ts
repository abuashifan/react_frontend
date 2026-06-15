import { z } from 'zod'

export const purchaseOrderSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  payment_term_id: z.number().nullable().optional(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
})

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>
