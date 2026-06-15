import { z } from 'zod'

export const paymentTermsSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  days: z.number().int().min(0, 'Hari tidak boleh negatif'),
  description: z.string().optional(),
})

export type PaymentTermsFormValues = z.infer<typeof paymentTermsSchema>
