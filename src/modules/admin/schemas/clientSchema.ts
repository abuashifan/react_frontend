import { z } from 'zod'

const email = z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid')
const password = z.string().min(8, 'Password minimal 8 karakter')

export const createClientSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
  email,
  password,
  // Select mengirim string; kosong berarti tanpa paket (kuota jatuh ke Free).
  plan_id: z.string().optional(),
})

export const editClientSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
  email,
  status: z.string().min(1, 'Status wajib dipilih'),
  plan_id: z.string().optional(),
})

export const resetPasswordSchema = z.object({
  password,
})

export type CreateClientValues = z.infer<typeof createClientSchema>
export type EditClientValues = z.infer<typeof editClientSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
