import { z } from 'zod'

export const proyekSchema = z.object({
  name: z.string().min(1, 'Nama proyek wajib diisi'),
  status: z.enum(['active', 'completed', 'cancelled']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export type ProyekFormValues = z.infer<typeof proyekSchema>
