import { z } from 'zod'

/**
 * Skema Zod modul anggaran. Sebelumnya ditulis inline di
 * `BudgetPeriodFormPage.tsx`; dipindah ke sini mengikuti
 * `spec-03-folder-structure`.
 */
export const budgetPeriodSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  fiscal_year: z.string().regex(/^\d{4}$/, 'Tahun tidak valid'),
  period_from: z.string().min(1, 'Tanggal mulai wajib diisi'),
  period_to: z.string().min(1, 'Tanggal selesai wajib diisi'),
})

export type BudgetPeriodFormValues = z.infer<typeof budgetPeriodSchema>

/**
 * Format periode baris anggaran. Backend mencocokkan string ini dengan bulan
 * jurnal — salah ketik berarti peringatan over-budget diam-diam tidak pernah
 * menyala, tanpa error apa pun. Karena itu divalidasi ketat di klien juga.
 */
export const BUDGET_PERIOD_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export const budgetLineSchema = z.object({
  account_id: z.number({ message: 'Akun wajib dipilih' }),
  department_id: z.number().nullable().optional(),
  project_id: z.number().nullable().optional(),
  period_month: z
    .string()
    .regex(BUDGET_PERIOD_MONTH_PATTERN, 'Format harus YYYY-MM, mis. 2026-01')
    .or(z.literal(''))
    .nullable()
    .optional(),
  amount: z.number().min(0, 'Nominal tidak boleh negatif'),
})

export type BudgetLineFormValues = z.infer<typeof budgetLineSchema>

/**
 * Alasan revisi wajib dan tidak boleh sekadar "revisi" — inilah satu-satunya
 * penjelasan kenapa angka anggaran berubah antar versi. Batas 10 karakter
 * disamakan dengan `ReviseBudgetSubmissionRequest` di backend.
 */
export const budgetRevisionSchema = z.object({
  revision_reason: z
    .string()
    .min(10, 'Alasan revisi minimal 10 karakter — jelaskan apa yang berubah dan mengapa')
    .max(1000, 'Alasan revisi maksimal 1000 karakter'),
})

export type BudgetRevisionFormValues = z.infer<typeof budgetRevisionSchema>
