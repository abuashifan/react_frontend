import { z } from 'zod'

export const stockMovementLineSchema = z.object({
  product_id: z.number({ message: 'Produk wajib dipilih' }).int().positive('Produk wajib dipilih'),
  warehouse_id: z.number({ message: 'Gudang wajib dipilih' }).int().positive('Gudang wajib dipilih'),
  quantity: z.number().gt(0, 'Qty harus lebih dari 0'),
  unit_cost: z.number().min(0).optional(),
})

export const stockMovementSchema = z.object({
  movement_date: z.string().min(1, 'Tanggal wajib diisi'),
  movement_type: z.string().min(1, 'Tipe movement wajib dipilih'),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>
export type StockMovementLineValues = z.infer<typeof stockMovementLineSchema>
