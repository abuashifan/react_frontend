import { z } from 'zod'

export const stockMovementSchema = z.object({
  movement_date: z.string().min(1, 'Tanggal wajib diisi'),
  movement_type: z.string().min(1, 'Tipe movement wajib dipilih'),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>
