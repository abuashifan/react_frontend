import { z } from 'zod'

export const stockOpnameSchema = z.object({
  opname_date: z.string().min(1, 'Tanggal wajib diisi'),
  warehouse_id: z.number({ message: 'Gudang wajib dipilih' }),
  notes: z.string().optional(),
})

export type StockOpnameFormValues = z.infer<typeof stockOpnameSchema>
