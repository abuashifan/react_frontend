import { z } from 'zod'

export const departemenSchema = z.object({
  name: z.string().min(1, 'Nama departemen wajib diisi'),
})

export type DepartemenFormValues = z.infer<typeof departemenSchema>
