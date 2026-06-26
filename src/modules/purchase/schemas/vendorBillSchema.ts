import { z } from 'zod'

export const vendorBillSchema = z.object({
  vendor_id: z.number({ message: 'Vendor wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  due_date: z.string().optional(),
  payment_term_id: z.number().nullable().optional(),
  applied_vendor_deposit_amount: z.number().nullable().optional(),
  notes: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.due_date && values.date && values.due_date < values.date) {
    ctx.addIssue({ code: 'custom', path: ['due_date'], message: 'Jatuh tempo harus sama atau setelah tanggal bill' })
  }

  if (values.applied_vendor_deposit_amount != null && values.applied_vendor_deposit_amount < 0) {
    ctx.addIssue({ code: 'custom', path: ['applied_vendor_deposit_amount'], message: 'Deposit terpakai tidak boleh negatif' })
  }
})

export type VendorBillFormValues = z.infer<typeof vendorBillSchema>

// --- Validasi line item (A13-163) ---
export interface VendorBillLineDraft {
  product_id: number | null
  line_classification: 'inventory' | 'fixed_asset'
  fixed_asset_category_id: number | null
  description: string
  quantity: number
  unit_price: number
}

export type VendorBillLineField = 'product' | 'description' | 'quantity' | 'unit_price'
export type VendorBillLineErrors = Record<number, Partial<Record<VendorBillLineField, string>>>

const vendorBillLineSchema = z
  .object({
    product_id: z.number().nullable(),
    line_classification: z.enum(['inventory', 'fixed_asset']),
    fixed_asset_category_id: z.number().nullable(),
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
  })
  .superRefine((line, ctx) => {
    if (line.line_classification === 'fixed_asset') {
      if (!line.fixed_asset_category_id) ctx.addIssue({ code: 'custom', path: ['product'], message: 'Kategori aset wajib dipilih' })
    } else if (!line.product_id) {
      ctx.addIssue({ code: 'custom', path: ['product'], message: 'Produk wajib dipilih' })
    }
    if (!line.description.trim()) ctx.addIssue({ code: 'custom', path: ['description'], message: 'Deskripsi wajib diisi' })
    if (!(line.quantity > 0)) ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'Qty harus lebih dari 0' })
    if (line.unit_price < 0) ctx.addIssue({ code: 'custom', path: ['unit_price'], message: 'Harga tidak boleh negatif' })
  })

/** Validasi seluruh line via Zod; mengembalikan map error per index baris (kosong = valid). */
export function validateVendorBillLines(lines: VendorBillLineDraft[]): VendorBillLineErrors {
  const errors: VendorBillLineErrors = {}
  lines.forEach((line, index) => {
    const result = vendorBillLineSchema.safeParse(line)
    if (result.success) return
    const rowError: VendorBillLineErrors[number] = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as VendorBillLineField
      if (field && !rowError[field]) rowError[field] = issue.message
    }
    errors[index] = rowError
  })
  return errors
}
