import { z } from 'zod'

export const journalEntrySchema = z.object({
  journal_date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().optional(),
})

export type JournalEntryFormValues = z.infer<typeof journalEntrySchema>
