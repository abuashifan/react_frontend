import { z } from 'zod'

export const kontakSchema = z.object({
  contact_code: z.string().max(50, 'Kode maksimal 50 karakter').optional(),
  name: z.string().min(1, 'Nama wajib diisi'),
  contact_type: z.enum(['customer', 'supplier', 'both', 'employee', 'other']),
  phone: z.string().optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  address: z.string().optional(),
  tax_number: z.string().optional(),
  payment_term_id: z.number().nullable().optional(),
})

export type KontakFormValues = z.infer<typeof kontakSchema>
