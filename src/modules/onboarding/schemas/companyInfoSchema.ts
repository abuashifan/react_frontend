import { z } from 'zod'

export const companyInfoSchema = z.object({
  name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  npwp: z.string().optional(),
  address: z.string().optional(),
  fiscal_year_start: z.string().min(1, 'Bulan mulai tahun fiskal wajib dipilih'),
  currency: z.string().min(1, 'Mata uang wajib dipilih'),
})

export type CompanyInfoValues = z.infer<typeof companyInfoSchema>
