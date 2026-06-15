import { z } from 'zod'

export const satuanSchema = z.object({
  name: z.string().min(1, 'Nama satuan wajib diisi'),
  symbol: z.string().min(1, 'Simbol wajib diisi'),
  decimal_places: z.number().int().min(0).max(8),
})

export type SatuanFormValues = z.infer<typeof satuanSchema>
