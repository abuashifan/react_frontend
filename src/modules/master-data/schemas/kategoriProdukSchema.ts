import { z } from 'zod'

export const kategoriProdukSchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
})

export type KategoriProdukFormValues = z.infer<typeof kategoriProdukSchema>
