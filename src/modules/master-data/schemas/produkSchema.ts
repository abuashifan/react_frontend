import { z } from 'zod'

export const produkSchema = z.object({
  product_code: z.string().max(50, 'SKU maksimal 50 karakter').optional(),
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
}).superRefine((values, context) => {
  if (values.is_stock_item && !values.unit_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['unit_id'],
      message: 'Satuan wajib dipilih untuk item stok',
    })
  }

  if (['service', 'fixed_asset'].includes(values.product_type) && values.is_stock_item) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['is_stock_item'],
      message: 'Jasa dan aktiva tetap tidak dapat menjadi item stok',
    })
  }
})

export type ProdukFormValues = z.infer<typeof produkSchema>
