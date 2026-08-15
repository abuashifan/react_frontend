import { z } from 'zod'

export const budgetSubmissionSchema = z.object({
  budget_period_id: z
    .number({ error: 'Periode anggaran wajib dipilih' })
    .int()
    .positive('Periode anggaran wajib dipilih'),
  // null bukan "belum diisi" — itu pilihan sah yang berarti anggaran tingkat
  // perusahaan. Karena itu nullable, bukan optional.
  department_id: z.number().int().positive().nullable(),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
})

export type BudgetSubmissionFormValues = z.infer<typeof budgetSubmissionSchema>
