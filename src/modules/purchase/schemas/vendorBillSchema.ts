import { z } from 'zod'

export const vendorBillSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  due_date: z.string().optional(),
  buyer_id: z.number().nullable().optional(),
  payment_term_id: z.number().nullable().optional(),
  notes: z.string().optional(),
}).refine((data) => !data.due_date || data.due_date >= data.date, {
  message: 'Tanggal jatuh tempo tidak boleh sebelum tanggal tagihan',
  path: ['due_date'],
})

export type VendorBillFormValues = z.infer<typeof vendorBillSchema>
