import { z } from 'zod'

export const proyekSchema = z
  .object({
    // Wajib di backend (`StoreProjectRequest`) dan tidak dibangkitkan otomatis.
    // Sebelumnya tidak ada di sini, sehingga setiap pembuatan proyek 422 pada
    // field yang bahkan tidak ditampilkan.
    code: z.string().min(1, 'Kode proyek wajib diisi').max(50, 'Kode proyek maksimal 50 karakter'),
    name: z.string().min(1, 'Nama proyek wajib diisi').max(255, 'Nama proyek maksimal 255 karakter'),
    description: z.string().optional(),
    status: z.enum(['active', 'completed', 'on_hold', 'cancelled']),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  // Cerminan aturan yang sama di backend. Divalidasi di sini juga supaya
  // pengguna tahu sebelum request terkirim, bukan setelah 422.
  .refine(
    (v) => !v.start_date || !v.end_date || v.end_date >= v.start_date,
    { message: 'Tanggal selesai tidak boleh sebelum tanggal mulai', path: ['end_date'] },
  )

export type ProyekFormValues = z.infer<typeof proyekSchema>
