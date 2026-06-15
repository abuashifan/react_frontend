import { z } from 'zod'

export const goodsReceiptSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  warehouse_id: z.number().nullable().optional(),
  notes: z.string().optional(),
})

export type GoodsReceiptFormValues = z.infer<typeof goodsReceiptSchema>
