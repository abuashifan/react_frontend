import { z } from 'zod'

export const purchaseRequestSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  needed_date: z.string().optional(),
  requester_id: z.number().nullable().optional(),
  department_id: z.number().nullable().optional(),
  project_id: z.number().nullable().optional(),
  notes: z.string().optional(),
}).refine((data) => !data.needed_date || data.needed_date >= data.date, {
  message: 'Tanggal dibutuhkan tidak boleh sebelum tanggal PR',
  path: ['needed_date'],
})

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>
