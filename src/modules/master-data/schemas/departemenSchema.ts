import { z } from 'zod'

export const departemenSchema = z.object({
  code: z.string().min(1, 'Kode departemen wajib diisi').max(50),
  name: z.string().min(1, 'Nama departemen wajib diisi'),
  description: z.string().optional(),
})

export type DepartemenFormValues = z.infer<typeof departemenSchema>
