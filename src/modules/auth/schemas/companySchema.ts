import { z } from 'zod'

export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama perusahaan minimal 3 karakter')
    .max(100, 'Nama perusahaan maksimal 100 karakter'),
})

export type CreateCompanyValues = z.infer<typeof createCompanySchema>
