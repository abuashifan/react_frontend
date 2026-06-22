import { z } from 'zod'

export const proformaSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  expiry_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.expiry_date && value.expiry_date < value.date) {
    ctx.addIssue({ code: 'custom', path: ['expiry_date'], message: 'Tanggal berlaku tidak boleh sebelum tanggal proforma' })
  }
})

export type ProformaFormValues = z.infer<typeof proformaSchema>
