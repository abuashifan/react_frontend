import { z } from 'zod'

export const stockAdjustmentSchema = z.object({
  adjustment_date: z.string().min(1, 'Tanggal wajib diisi'),
  warehouse_id: z.number().nullable().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>
