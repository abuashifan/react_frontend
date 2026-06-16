import { z } from 'zod'

export const coaSchema = z.object({
  account_code: z.string().min(1, 'Kode akun wajib diisi'),
  account_name: z.string().min(1, 'Nama akun wajib diisi'),
  account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  parent_account_id: z.number().nullable().optional(),
  description: z.string().optional(),
})

export type CoaFormValues = z.infer<typeof coaSchema>
