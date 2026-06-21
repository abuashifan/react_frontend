import { z } from 'zod'

const selectOptionSchema = z.object({
  value: z.number(),
  label: z.string(),
  sublabel: z.string().optional(),
})

export const journalLineSchema = z.object({
  account_id: z.number().int().positive('Akun wajib dipilih').nullable(),
  account_option: selectOptionSchema.nullable(),
  department_id: z.number().int().positive().nullable(),
  department_option: selectOptionSchema.nullable(),
  project_id: z.number().int().positive().nullable(),
  project_option: selectOptionSchema.nullable(),
  description: z.string(),
  debit: z.number().min(0),
  credit: z.number().min(0),
})

export const journalEntrySchema = z
  .object({
    journal_date: z.string().min(1, 'Tanggal wajib diisi'),
    description: z.string().optional(),
    edit_reason: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, 'Minimal dua baris jurnal'),
  })
  .superRefine((val, ctx) => {
    let totalDebit = 0
    let totalCredit = 0

    val.lines.forEach((line, i) => {
      const debit = line.debit ?? 0
      const credit = line.credit ?? 0

      if (line.account_id == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Akun wajib dipilih', path: ['lines', i, 'account_id'] })
      }
      if (debit > 0 && credit > 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Isi salah satu: debit atau kredit', path: ['lines', i, 'debit'] })
      }
      if (debit === 0 && credit === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Isi debit atau kredit', path: ['lines', i, 'debit'] })
      }

      totalDebit += debit
      totalCredit += credit
    })

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Total debit harus sama dengan total kredit', path: ['lines'] })
    }
  })

export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>
export type JournalLineFormValues = z.infer<typeof journalLineSchema>
