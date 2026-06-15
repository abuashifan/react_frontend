import { z } from 'zod'

export const produkSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  category_id: z.number().nullable().optional(),
  unit_id: z.number().nullable().optional(),
  is_stock_item: z.boolean(),
  sell_price: z.number().min(0).optional(),
  buy_price: z.number().min(0).optional(),
  coa_sales_id: z.number().nullable().optional(),
  coa_purchase_id: z.number().nullable().optional(),
  coa_inventory_id: z.number().nullable().optional(),
})

export type ProdukFormValues = z.infer<typeof produkSchema>
