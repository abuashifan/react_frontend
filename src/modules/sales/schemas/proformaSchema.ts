import { z } from 'zod'

export const proformaSchema = z.object({
  customer_id: z.number({ message: 'Pelanggan wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  notes: z.string().nullable().optional(),
})

export type ProformaFormValues = z.infer<typeof proformaSchema>
