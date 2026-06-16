import { z } from 'zod'

export const satuanSchema = z.object({
  name: z.string().min(1, 'Nama satuan wajib diisi'),
  code: z.string().min(1, 'Kode wajib diisi'),
  precision: z.number().int().min(0).max(8),
})

export type SatuanFormValues = z.infer<typeof satuanSchema>
