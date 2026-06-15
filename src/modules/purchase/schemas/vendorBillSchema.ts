import { z } from 'zod'

export const vendorBillSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  due_date: z.string().optional(),
  payment_term_id: z.number().nullable().optional(),
  notes: z.string().optional(),
})

export type VendorBillFormValues = z.infer<typeof vendorBillSchema>
