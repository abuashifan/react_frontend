import { z } from 'zod'

export const kontakSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.enum(['customer', 'supplier', 'both']),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  npwp: z.string().optional(),
  payment_term_id: z.number().nullable().optional(),
})

export type KontakFormValues = z.infer<typeof kontakSchema>
