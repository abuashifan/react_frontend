import { z } from 'zod'

export const stockAdjustmentLineSchema = z.object({
  product_id: z.number({ message: 'Produk wajib dipilih' }).int().positive('Produk wajib dipilih'),
  warehouse_id: z.number({ message: 'Gudang wajib dipilih' }).int().positive('Gudang wajib dipilih'),
  adjustment_type: z.enum(['increase', 'decrease']),
  quantity: z.number().gt(0, 'Qty harus lebih dari 0'),
  unit_cost: z.number().min(0).optional(),
  reason: z.string().optional(),
})

export const stockAdjustmentSchema = z.object({
  adjustment_date: z.string().min(1, 'Tanggal wajib diisi'),
  warehouse_id: z.number().nullable().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>
export type StockAdjustmentLineValues = z.infer<typeof stockAdjustmentLineSchema>
