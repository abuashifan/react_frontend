import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form/FormField'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { todayInputValue } from '@/lib/utils'
import {
  disbursementAmount, kindLabels, toRupiah, workspaceDisbursementApi,
  type QcInput, type SettlementInput, type Tranche, type TrancheInput, type WorkspaceDisbursement,
} from '../../services/workspaceDisbursementApi'

/** Formulir aksi pada satu tahap. Semua formulir memakai `id` agar tombol simpan di footer dialog bisa memicunya. */
export const FORM_ID = 'workspace-disbursement-action'

const amount = z.number().min(0).max(999_999_999_999.99)
const lineMap = (row: WorkspaceDisbursement) => new Map(row.source_lines.map((line) => [line.id, line]))

const trancheSchema = z.object({
  kind: z.enum(['direct', 'advance']),
  disbursed_on: z.string().min(1, 'Pilih tanggal pencairan.'),
  cash_bank_account_id: z.number().int().positive({ message: 'Pilih akun kas/bank.' }).nullable().refine((value) => value !== null, 'Pilih akun kas/bank.'),
  payment_reference: z.string().trim().min(1, 'Masukkan referensi pencairan.').max(160),
  lines: z.array(z.object({ source_line_id: z.number(), amount, limit: z.number() })),
}).superRefine((data, context) => {
  if (data.lines.every((line) => line.amount <= 0)) context.addIssue({ code: 'custom', path: ['lines'], message: 'Isi nominal pada sedikitnya satu baris.' })
  data.lines.forEach((line, index) => {
    if (Math.round(line.amount * 100) > line.limit) context.addIssue({ code: 'custom', path: ['lines', index, 'amount'], message: 'Melebihi sisa RAB ' + disbursementAmount(line.limit) + '.' })
  })
})

/** Catat tahap baru atau koreksi tahap yang belum lolos QC. Nominal awal = sisa RAB per baris. */
export function TrancheForm({ row, tranche, onSubmit }: { row: WorkspaceDisbursement; tranche?: Tranche; onSubmit: (input: TrancheInput) => void }) {
  const own = new Map((tranche?.lines ?? []).map((line) => [line.source_line_id, line.amount_minor]))
  const { control, register, handleSubmit, formState: { errors } } = useForm<z.input<typeof trancheSchema>, unknown, z.output<typeof trancheSchema>>({
    resolver: zodResolver(trancheSchema),
    defaultValues: {
      kind: tranche?.kind ?? 'direct',
      disbursed_on: tranche?.disbursed_on ?? todayInputValue(),
      cash_bank_account_id: tranche?.cash_bank_account?.id ?? null,
      payment_reference: tranche?.payment_reference ?? '',
      lines: row.source_lines.map((line) => {
        const limit = line.remaining_minor + (own.get(line.id) ?? 0)
        return { source_line_id: line.id, amount: toRupiah(tranche ? own.get(line.id) ?? 0 : line.remaining_minor), limit }
      }),
    },
  })
  const { fields } = useFieldArray({ control, name: 'lines' })
  const lines = useWatch({ control, name: 'lines' })
  const sources = lineMap(row)
  const total = (lines ?? []).reduce((sum, line) => sum + Math.round((line.amount || 0) * 100), 0)

  return (
    <form id={FORM_ID} className="space-y-3" onSubmit={handleSubmit((data) => onSubmit({
      kind: data.kind, disbursed_on: data.disbursed_on, cash_bank_account_id: data.cash_bank_account_id!, payment_reference: data.payment_reference,
      lines: data.lines.filter((line) => line.amount > 0).map(({ source_line_id, amount }) => ({ source_line_id, amount })),
    }))}>
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Jenis tahap</legend>
        {(Object.keys(kindLabels) as (keyof typeof kindLabels)[]).map((kind) => (
          <label key={kind} className="flex items-center gap-2">
            <input type="radio" value={kind} {...register('kind')} /> {kindLabels[kind]}
          </label>
        ))}
      </fieldset>
      <p className="text-xs text-muted-foreground">Dana muka dicatat ke akun uang muka dan baru menjadi biaya saat diselesaikan dengan bukti.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Tanggal pencairan" htmlFor="tranche-date" required error={errors.disbursed_on?.message}>
          <Input id="tranche-date" type="date" max={todayInputValue()} {...register('disbursed_on')} />
        </FormField>
        <FormField label="Akun kas/bank" htmlFor="tranche-cash" required error={errors.cash_bank_account_id?.message}>
          <Controller name="cash_bank_account_id" control={control} render={({ field }) => (
            <SearchableSelect value={field.value ?? null} onChange={field.onChange} onSearch={(q) => workspaceDisbursementApi.options('cash', q)}
              triggerId="tranche-cash" triggerAriaLabel="Akun kas/bank" placeholder="Pilih kas/bank"
              selectedOptions={tranche?.cash_bank_account ? [{ value: tranche.cash_bank_account.id, label: tranche.cash_bank_account.account_code + ' · ' + tranche.cash_bank_account.account_name }] : []} />
          )} />
        </FormField>
        <FormField label="Referensi pencairan" htmlFor="tranche-reference" required error={errors.payment_reference?.message}>
          <Input id="tranche-reference" maxLength={160} {...register('payment_reference')} />
        </FormField>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-sm">
          <caption className="sr-only">Nominal tahap per baris RAB</caption>
          <thead><tr className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <th scope="col" className="px-3 py-2">Pos</th><th scope="col" className="px-3 py-2">Rincian</th>
            <th scope="col" className="px-3 py-2 text-right">Sisa RAB</th><th scope="col" className="px-3 py-2 text-right">Dicairkan tahap ini</th>
          </tr></thead>
          <tbody>{fields.map((field, index) => {
            const source = sources.get(field.source_line_id)!
            return (
              <tr key={field.id} className="border-t border-border">
                <td className="px-3 py-2">{source.budget_code}</td>
                <td className="px-3 py-2">{source.description}</td>
                <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(field.limit)}</td>
                <td className="px-3 py-2">
                  <Controller name={`lines.${index}.amount`} control={control} render={({ field: input }) => (
                    <AmountInput value={input.value} onChange={input.onChange} decimals={2} ariaLabel={'Nominal ' + source.description} className="text-right" />
                  )} />
                  {errors.lines?.[index]?.amount?.message && <p role="alert" className="text-xs text-red-600">{errors.lines[index]?.amount?.message}</p>}
                </td>
              </tr>
            )
          })}</tbody>
          <tfoot><tr className="border-t border-border font-semibold">
            <td colSpan={3} className="px-3 py-2">Total tahap</td>
            <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(total)}</td>
          </tr></tfoot>
        </table>
      </div>
      {errors.lines?.message && <p role="alert" className="text-sm text-red-600">{errors.lines.message}</p>}
    </form>
  )
}

const id = z.number().int().positive().nullable()
const qcSchema = z.object({
  note: z.string().trim().max(1000),
  advance_account_id: id,
  lines: z.array(z.object({ source_line_id: z.number(), account_id: id, department_id: id, project_id: id })),
})

const dimensions = [
  { id: 'account_id', type: 'expense', label: 'Akun biaya', suggestion: 'account' },
  { id: 'department_id', type: 'department', label: 'Departemen', suggestion: 'department' },
  { id: 'project_id', type: 'project', label: 'Proyek', suggestion: 'project' },
] as const

/** Setujui QC: akun biaya per baris (biaya langsung) atau akun uang muka (dana muka). */
export function QcApproveForm({ row, tranche, onSubmit }: { row: WorkspaceDisbursement; tranche: Tranche; onSubmit: (input: QcInput) => void }) {
  const suggestions = new Map(row.suggested_lines.map((line) => [line.source_line_id, line]))
  const advance = tranche.kind === 'advance'
  const { control, register, handleSubmit, setError, formState: { errors } } = useForm<z.infer<typeof qcSchema>>({
    resolver: zodResolver(qcSchema),
    defaultValues: {
      note: '',
      advance_account_id: row.suggested_advance_account?.value ?? null,
      lines: tranche.lines.map((line) => {
        const suggested = suggestions.get(line.source_line_id)
        return { source_line_id: line.source_line_id, account_id: suggested?.account?.value ?? null, department_id: suggested?.department?.value ?? null, project_id: suggested?.project?.value ?? null }
      }),
    },
  })
  const sources = lineMap(row)
  const submit = handleSubmit((data) => {
    if (advance) {
      if (data.advance_account_id === null) return setError('advance_account_id', { message: 'Pilih akun uang muka.' })
      return onSubmit({ note: data.note || undefined, advance_account_id: data.advance_account_id })
    }
    const missing = data.lines.findIndex((line) => line.account_id === null)
    if (missing >= 0) return setError(`lines.${missing}.account_id`, { message: 'Pilih akun biaya.' })
    onSubmit({ note: data.note || undefined, lines: data.lines.map((line) => ({ ...line, account_id: line.account_id! })) })
  })

  return (
    <form id={FORM_ID} className="space-y-3" onSubmit={submit}>
      {advance ? (
        <FormField label="Akun uang muka" htmlFor="qc-advance" required error={errors.advance_account_id?.message}>
          <Controller name="advance_account_id" control={control} render={({ field }) => (
            <SearchableSelect value={field.value} onChange={field.onChange} onSearch={(q) => workspaceDisbursementApi.options('advance', q)}
              triggerId="qc-advance" triggerAriaLabel="Akun uang muka" placeholder="Pilih akun uang muka"
              selectedOptions={row.suggested_advance_account ? [row.suggested_advance_account] : []} />
          )} />
        </FormField>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <caption className="sr-only">Akun biaya per baris tahap</caption>
            <thead><tr className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <th scope="col" className="px-3 py-2">Rincian</th><th scope="col" className="px-3 py-2 text-right">Nominal</th>
              {dimensions.map((dimension) => <th key={dimension.id} scope="col" className="px-3 py-2">{dimension.label}</th>)}
            </tr></thead>
            <tbody>{tranche.lines.map((line, index) => {
              const source = sources.get(line.source_line_id)!
              const suggested = suggestions.get(line.source_line_id)
              return (
                <tr key={line.source_line_id} className="border-t border-border">
                  <td className="px-3 py-2">{source.budget_code} · {source.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(line.amount_minor)}</td>
                  {dimensions.map(({ id: key, type, label, suggestion }) => (
                    <td key={key} className="min-w-[170px] px-3 py-2">
                      <Controller name={`lines.${index}.${key}`} control={control} render={({ field }) => (
                        <SearchableSelect value={field.value} onChange={field.onChange} onSearch={(q) => workspaceDisbursementApi.options(type, q)}
                          triggerAriaLabel={label + ' untuk ' + source.description} placeholder={'Pilih ' + label.toLowerCase()} size="sm"
                          selectedOptions={suggested?.[suggestion] ? [suggested[suggestion]!] : []} error={errors.lines?.[index]?.[key]?.message} />
                      )} />
                    </td>
                  ))}
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      )}
      <FormField label="Catatan QC" htmlFor="qc-note">
        <Input id="qc-note" maxLength={1000} {...register('note')} />
      </FormField>
    </form>
  )
}

const settlementSchema = z.object({
  settled_on: z.string().min(1, 'Pilih tanggal penyelesaian.'),
  refund_cash_bank_account_id: id,
  note: z.string().trim().max(1000),
  lines: z.array(z.object({ source_line_id: z.number(), amount, limit: z.number(), account_id: id })),
})

/** Penyelesaian dana muka: biaya terverifikasi per baris, sisanya dikembalikan ke kas/bank. */
export function SettlementForm({ row, tranche, onSubmit }: { row: WorkspaceDisbursement; tranche: Tranche; onSubmit: (input: SettlementInput) => void }) {
  const suggestions = new Map(row.suggested_lines.map((line) => [line.source_line_id, line]))
  const { control, register, handleSubmit, setError, formState: { errors } } = useForm<z.input<typeof settlementSchema>, unknown, z.output<typeof settlementSchema>>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      settled_on: todayInputValue(), refund_cash_bank_account_id: tranche.cash_bank_account?.id ?? null, note: '',
      lines: tranche.lines.map((line) => ({
        source_line_id: line.source_line_id, amount: toRupiah(line.amount_minor), limit: line.amount_minor,
        account_id: suggestions.get(line.source_line_id)?.account?.value ?? null,
      })),
    },
  })
  const lines = useWatch({ control, name: 'lines' })
  const spent = (lines ?? []).reduce((sum, line) => sum + Math.round((line.amount || 0) * 100), 0)
  const refund = tranche.amount_minor - spent
  const sources = lineMap(row)
  const submit = handleSubmit((data) => {
    let invalid = false
    data.lines.forEach((line, index) => {
      if (Math.round(line.amount * 100) > line.limit) { setError(`lines.${index}.amount`, { message: 'Melebihi dana muka baris ini.' }); invalid = true }
      if (line.amount > 0 && line.account_id === null) { setError(`lines.${index}.account_id`, { message: 'Pilih akun biaya.' }); invalid = true }
    })
    if (refund > 0 && data.refund_cash_bank_account_id === null) { setError('refund_cash_bank_account_id', { message: 'Pilih akun kas/bank untuk pengembalian.' }); invalid = true }
    if (invalid) return
    onSubmit({
      settled_on: data.settled_on, refund_cash_bank_account_id: refund > 0 ? data.refund_cash_bank_account_id : null, note: data.note || undefined,
      lines: data.lines.filter((line) => line.amount > 0).map((line) => ({ source_line_id: line.source_line_id, amount: line.amount, account_id: line.account_id! })),
    })
  })

  return (
    <form id={FORM_ID} className="space-y-3" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Tanggal penyelesaian" htmlFor="settle-date" required error={errors.settled_on?.message}>
          <Input id="settle-date" type="date" min={tranche.disbursed_on} max={todayInputValue()} {...register('settled_on')} />
        </FormField>
        <FormField label="Akun kas/bank pengembalian" htmlFor="settle-refund" required={refund > 0} error={errors.refund_cash_bank_account_id?.message}>
          <Controller name="refund_cash_bank_account_id" control={control} render={({ field }) => (
            <SearchableSelect value={field.value} onChange={field.onChange} onSearch={(q) => workspaceDisbursementApi.options('cash', q)} disabled={refund <= 0}
              triggerId="settle-refund" triggerAriaLabel="Akun kas/bank pengembalian" placeholder="Pilih kas/bank"
              selectedOptions={tranche.cash_bank_account ? [{ value: tranche.cash_bank_account.id, label: tranche.cash_bank_account.account_code + ' · ' + tranche.cash_bank_account.account_name }] : []} />
          )} />
        </FormField>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-sm">
          <caption className="sr-only">Biaya terverifikasi per baris dana muka</caption>
          <thead><tr className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <th scope="col" className="px-3 py-2">Rincian</th><th scope="col" className="px-3 py-2 text-right">Dana muka</th>
            <th scope="col" className="px-3 py-2 text-right">Biaya terverifikasi</th><th scope="col" className="px-3 py-2">Akun biaya</th>
          </tr></thead>
          <tbody>{tranche.lines.map((line, index) => {
            const source = sources.get(line.source_line_id)!
            const suggested = suggestions.get(line.source_line_id)?.account
            return (
              <tr key={line.source_line_id} className="border-t border-border">
                <td className="px-3 py-2">{source.budget_code} · {source.description}</td>
                <td className="px-3 py-2 text-right tabular-nums">{disbursementAmount(line.amount_minor)}</td>
                <td className="px-3 py-2">
                  <Controller name={`lines.${index}.amount`} control={control} render={({ field }) => (
                    <AmountInput value={field.value} onChange={field.onChange} decimals={2} blankOnZero={false} ariaLabel={'Biaya terverifikasi ' + source.description} className="text-right" />
                  )} />
                  {errors.lines?.[index]?.amount?.message && <p role="alert" className="text-xs text-red-600">{errors.lines[index]?.amount?.message}</p>}
                </td>
                <td className="min-w-[180px] px-3 py-2">
                  <Controller name={`lines.${index}.account_id`} control={control} render={({ field }) => (
                    <SearchableSelect value={field.value} onChange={field.onChange} onSearch={(q) => workspaceDisbursementApi.options('expense', q)}
                      triggerAriaLabel={'Akun biaya untuk ' + source.description} placeholder="Pilih akun biaya" size="sm"
                      selectedOptions={suggested ? [suggested] : []} error={errors.lines?.[index]?.account_id?.message} />
                  )} />
                </td>
              </tr>
            )
          })}</tbody>
        </table>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div><dt className="text-muted-foreground">Dana muka</dt><dd className="tabular-nums">{disbursementAmount(tranche.amount_minor)}</dd></div>
        <div><dt className="text-muted-foreground">Biaya terverifikasi</dt><dd className="tabular-nums">{disbursementAmount(spent)}</dd></div>
        <div><dt className="text-muted-foreground">Dikembalikan</dt><dd className={'tabular-nums ' + (refund < 0 ? 'text-red-600' : '')}>{disbursementAmount(refund)}</dd></div>
      </dl>
      <FormField label="Catatan" htmlFor="settle-note">
        <Input id="settle-note" maxLength={1000} {...register('note')} />
      </FormField>
    </form>
  )
}

const noteSchema = z.object({ note: z.string().trim().min(1, 'Masukkan alasan.').max(1000) })

export function NoteForm({ label, hint, onSubmit }: { label: string; hint?: string; onSubmit: (note: string) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof noteSchema>>({ resolver: zodResolver(noteSchema), defaultValues: { note: '' } })
  return (
    <form id={FORM_ID} className="space-y-2" onSubmit={handleSubmit(({ note }) => onSubmit(note))}>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <FormField label={label} htmlFor="action-note" required error={errors.note?.message}>
        <Input id="action-note" maxLength={1000} {...register('note')} />
      </FormField>
    </form>
  )
}
