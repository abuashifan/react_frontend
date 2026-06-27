import { z } from 'zod'

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === undefined || Number.isNaN(value) ? null : value),
  z.coerce.number().nullable().optional(),
)

const requiredNumber = (message: string) =>
  z.preprocess(
    (value) => (value === '' || value === undefined || Number.isNaN(value) ? undefined : value),
    z.coerce.number({ message }).min(1, message),
  )

const usefulLife = z.preprocess(
  (value) => (value === '' || value === undefined || Number.isNaN(value) ? null : Number(value)),
  z.union([z.literal(4), z.literal(8), z.literal(10), z.literal(16), z.literal(20)]).nullable().optional(),
)

export const fixedAssetSchema = z.object({
  name: z.string().min(1, 'Nama aktiva wajib diisi'),
  description: z.string().nullable().optional(),
  fixed_asset_category_id: requiredNumber('Kategori wajib dipilih'),
  acquisition_date: z.string().min(1, 'Tanggal perolehan wajib diisi'),
  acquisition_cost: z.coerce.number().min(0, 'Nilai perolehan tidak boleh negatif'),
  service_start_date: z.string().nullable().optional(),
  useful_life_years: usefulLife,
  quantity: optionalNumber,
  salvage_value: optionalNumber,
  department_id: optionalNumber,
  project_id: optionalNumber,
  source_type: z.string().nullable().optional(),
  source_id: optionalNumber,
}).superRefine((values, ctx) => {
  if (values.quantity !== null && values.quantity !== undefined && values.quantity <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['quantity'], message: 'Qty harus lebih besar dari 0' })
  }

  if (values.service_start_date && values.acquisition_date && values.service_start_date < values.acquisition_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['service_start_date'], message: 'Tanggal mulai pakai tidak boleh sebelum tanggal perolehan' })
  }

  if (values.salvage_value !== null && values.salvage_value !== undefined && values.salvage_value > values.acquisition_cost) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salvage_value'], message: 'Nilai residu tidak boleh melebihi nilai perolehan' })
  }
})

export const fixedAssetCategorySchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  asset_class: z.enum(['tangible', 'intangible']),
  depreciation_type: z.enum(['depreciation', 'amortization', 'none', 'impairment_only']),
  default_useful_life_years: usefulLife,
  asset_account_id: optionalNumber,
  accumulated_depreciation_account_id: optionalNumber,
  depreciation_expense_account_id: optionalNumber,
  clearing_account_id: optionalNumber,
  disposal_gain_account_id: optionalNumber,
  disposal_loss_account_id: optionalNumber,
  is_active: z.boolean().optional(),
})

export const capitalizeFixedAssetSchema = z.object({
  capitalization_date: z.string().nullable().optional(),
  source_type: z.string().nullable().optional(),
  source_id: optionalNumber,
  source_line_id: optionalNumber,
  vendor_id: optionalNumber,
  amount: optionalNumber,
})

export const disposeFixedAssetSchema = z.object({
  disposal_date: z.string().min(1, 'Tanggal disposal wajib diisi'),
  disposal_type: z.enum(['sale', 'write_off', 'scrap', 'lost']),
  disposed_quantity: z.coerce.number().min(1, 'Qty disposal minimal 1'),
  proceeds_amount: optionalNumber,
  cash_bank_account_id: optionalNumber,
  receivable_account_id: optionalNumber,
})

export type FixedAssetFormValues = z.infer<typeof fixedAssetSchema>
export type FixedAssetCategoryFormValues = z.infer<typeof fixedAssetCategorySchema>
export type CapitalizeFixedAssetFormValues = z.infer<typeof capitalizeFixedAssetSchema>
export type DisposeFixedAssetFormValues = z.infer<typeof disposeFixedAssetSchema>
