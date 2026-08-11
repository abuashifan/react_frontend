import { z } from 'zod'

const email = z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid')
const password = z.string().min(8, 'Password minimal 8 karakter')
const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter`).optional()

/**
 * Kuota khusus dan paket dikirim sebagai string dari input/select. Kosong
 * berarti "ikut paket" untuk kuota, dan "tanpa paket" untuk plan_id.
 */
const quota = (min: number) =>
  z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (/^\d+$/.test(value) && Number(value) >= min && Number(value) <= 999),
      `Isi angka ${min} sampai 999`,
    )

const profileFields = {
  phone: optionalText(50, 'Nomor telepon'),
  company_name: optionalText(255, 'Nama perusahaan'),
  job_title: optionalText(255, 'Jabatan'),
  address: optionalText(1000, 'Alamat'),
  notes: optionalText(2000, 'Catatan'),
  plan_id: z.string().optional(),
  company_quota: quota(0),
  // Minimal 1: perusahaan selalu punya owner.
  user_quota: quota(1),
  // Add-on boleh nol — kosong berarti client belum membeli tambahan apa pun.
  extra_users: quota(0),
}

export const createClientSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
  email,
  password,
  ...profileFields,
})

export const editClientSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
  email,
  status: z.string().min(1, 'Status wajib dipilih'),
  ...profileFields,
})

export const resetPasswordSchema = z.object({
  password,
})

export type CreateClientValues = z.infer<typeof createClientSchema>
export type EditClientValues = z.infer<typeof editClientSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
