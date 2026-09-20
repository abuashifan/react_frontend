import { z } from 'zod'

/*
 * Nama perusahaan sengaja TIDAK ada di sini. Nama sudah wajib diisi saat
 * perusahaan dibuat (CreateCompanyDialog -> POST /companies) karena slug, code,
 * dan berkas database tenant diturunkan darinya — jadi begitu wizard terbuka,
 * nama itu sudah pasti ada. Menanyakannya lagi di sini cuma membuat user
 * mengetik hal yang sama dua kali, dan isiannya pun tidak ke mana-mana: backend
 * belum punya endpoint untuk mengubah profil perusahaan. Step 1 menampilkannya
 * sebagai keterangan saja.
 */
export const companyInfoSchema = z.object({
  npwp: z.string().optional(),
  address: z.string().optional(),
  fiscal_year_start: z.string().min(1, 'Bulan mulai tahun fiskal wajib dipilih'),
  currency: z.string().min(1, 'Mata uang wajib dipilih'),
})

export type CompanyInfoValues = z.infer<typeof companyInfoSchema>
