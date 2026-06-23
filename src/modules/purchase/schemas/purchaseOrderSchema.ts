import { z } from 'zod'

export const purchaseOrderSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  buyer_id: z.number().nullable().optional(),
  payment_term_id: z.number().nullable().optional(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => !data.expected_delivery_date || data.expected_delivery_date >= data.date, {
  message: 'Tanggal pengiriman tidak boleh sebelum tanggal PO',
  path: ['expected_delivery_date'],
})

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>
