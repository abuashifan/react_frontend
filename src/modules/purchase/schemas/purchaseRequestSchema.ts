import { z } from 'zod'

export const purchaseRequestSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  department_id: z.number().nullable().optional(),
  notes: z.string().optional(),
})

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>
