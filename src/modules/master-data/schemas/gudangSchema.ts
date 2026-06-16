import { z } from 'zod'

export const gudangSchema = z.object({
  code: z.string().min(1, 'Kode gudang wajib diisi'),
  name: z.string().min(1, 'Nama gudang wajib diisi'),
  address: z.string().optional(),
  is_active: z.boolean(),
})

export type GudangFormValues = z.infer<typeof gudangSchema>
