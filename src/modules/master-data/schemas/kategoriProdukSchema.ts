import { z } from 'zod'

export const kategoriProdukSchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  description: z.string().optional(),
})

export type KategoriProdukFormValues = z.infer<typeof kategoriProdukSchema>
