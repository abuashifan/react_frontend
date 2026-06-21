import { z } from 'zod'

export const paymentTermsSchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  days: z.number().int().min(1, 'Jumlah hari minimal 1').max(3650, 'Jumlah hari maksimal 3650'),
  is_active: z.boolean().optional(),
})

export type PaymentTermsFormValues = z.infer<typeof paymentTermsSchema>
