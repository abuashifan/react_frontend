import { z } from 'zod'

export const coaSchema = z.object({
  code: z.string().min(1, 'Kode akun wajib diisi'),
  name: z.string().min(1, 'Nama akun wajib diisi'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  parent_id: z.number().nullable().optional(),
  description: z.string().optional(),
})

export type CoaFormValues = z.infer<typeof coaSchema>
