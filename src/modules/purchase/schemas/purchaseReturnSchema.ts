import { z } from 'zod'

export const purchaseReturnSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  notes: z.string().optional(),
})

export type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>
