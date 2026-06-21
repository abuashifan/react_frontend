import { z } from 'zod'

export const proyekSchema = z.object({
  code: z.string().min(1, 'Kode proyek wajib diisi').max(50),
  name: z.string().min(1, 'Nama proyek wajib diisi'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine(
  (values) => !values.start_date || !values.end_date || values.end_date >= values.start_date,
  { path: ['end_date'], message: 'Tanggal selesai tidak boleh sebelum tanggal mulai' },
)

export type ProyekFormValues = z.infer<typeof proyekSchema>
