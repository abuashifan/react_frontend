import { z } from 'zod'

export const produkSchema = z.object({
  product_code: z.string().optional(),
  product_name: z.string().min(1, 'Nama produk wajib diisi'),
  product_type: z.enum(['goods', 'service', 'non_inventory', 'fixed_asset']),
  product_category_id: z.number().nullable().optional(),
  unit_id: z.number().nullable().optional(),
  is_stock_item: z.boolean(),
  description: z.string().optional(),
  sales_account_id: z.number().nullable().optional(),
  purchase_account_id: z.number().nullable().optional(),
  inventory_account_id: z.number().nullable().optional(),
  cogs_account_id: z.number().nullable().optional(),
})

export type ProdukFormValues = z.infer<typeof produkSchema>
