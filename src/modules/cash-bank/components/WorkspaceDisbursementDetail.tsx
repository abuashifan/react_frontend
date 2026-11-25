import { useState, type MouseEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DialogFooter } from '@/components/ui/dialog'
import { FormField } from '@/components/shared/form/FormField'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { DataTable, type ColumnDef, type PaginationState } from '@/components/shared/table/DataTable'
import { usePermission } from '@/hooks/usePermission'
import { useRecordTab } from '@/hooks/useRecordTab'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate, todayInputValue } from '@/lib/utils'
import { disbursementAmount, disbursementPermissions, qcLabels, workspaceDisbursementApi, type SourceLine, type WorkspaceDisbursement } from '../services/workspaceDisbursementApi'

type Action = 'record' | 'approve' | 'reject' | 'reopen'
const actionLabel: Record<Action, string> = { record: 'Simpan pencairan', approve: 'Setujui QC', reject: 'Kembalikan QC', reopen: 'Buka kembali QC' }
const eventLabel: Record<string, string> = {
  record_disbursement: 'Pencairan dicatat', approve_qc: 'QC disetujui', reject_qc: 'QC dikembalikan', reopen_qc: 'QC dibuka kembali',
}
const dimensions = [
  { id: 'account_id', type: 'expense', label: 'Akun biaya' },
  { id: 'department_id', type: 'department', label: 'Departemen' },
  { id: 'project_id', type: 'project', label: 'Proyek' },
] as const

function schema(action?: Action) {
  const id = z.number().int().positive().nullable()
  return z.object({
    disbursed_on: z.string(), cash_bank_account_id: id, payment_reference: z.string().trim().max(160),
    note: z.string().trim().max(1000),
    lines: z.array(z.object({ source_line_id: z.number(), account_id: id, department_id: id, project_id: id })),
  }).superRefine((data, context) => {
    if (action === 'record') {
      if (!data.disbursed_on) context.addIssue({ code: 'custom', path: ['disbursed_on'], message: 'Pilih tanggal pencairan.' })
      if (!data.cash_bank_account_id) context.addIssue({ code: 'custom', path: ['cash_bank_account_id'], message: 'Pilih akun kas/bank.' })
      if (!data.payment_reference) context.addIssue({ code: 'custom', path: ['payment_reference'], message: 'Masukkan referensi pencairan.' })
    }
    if ((action === 'reject' || action === 'reopen') && !data.note) context.addIssue({ code: 'custom', path: ['note'], message: 'Masukkan alasan.' })
    if (action === 'approve') {
      data.lines.forEach((line, index) => {
        if (line.account_id === null) context.addIssue({ code: 'custom', path: ['lines', index, 'account_id'], message: 'Pilih akun biaya.' })
      })
    }
  })
}

export function WorkspaceDisbursementDetail({ row, onChange, onClose }: {
  row: WorkspaceDisbursement
  onChange: (data: WorkspaceDisbursement) => void
  onClose: () => void
}) {
  const { can } = usePermission()
  const { openRecordTab } = useRecordTab()
  const [action, setAction] = useState<Action>()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 100 })
  const defaults = {
    disbursed_on: row.disbursed_on ?? '',
    cash_bank_account_id: row.cash_bank_account_id,
    payment_reference: row.payment_reference ?? '',
    note: '',
    lines: row.source_lines.map((line) => ({ source_line_id: line.id, account_id: null, department_id: null, project_id: null })),
  }
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema(action)), defaultValues: defaults,
  })
  const mutation = useMutation({
    mutationFn: async (data: z.infer<ReturnType<typeof schema>>) => {
      if (action === 'record' && data.cash_bank_account_id !== null) {
        return workspaceDisbursementApi.record(row.id, {
          disbursed_on: data.disbursed_on, cash_bank_account_id: data.cash_bank_account_id, payment_reference: data.payment_reference,
        })
      }
      if (action === 'approve') {
        return workspaceDisbursementApi.review(row.id, action, {
          note: data.note || undefined,
          lines: data.lines.flatMap((line) => line.account_id === null ? [] : [{ ...line, account_id: line.account_id }]),
        })
      }
      if (action === 'reject' || action === 'reopen') return workspaceDisbursementApi.review(row.id, action, { note: data.note })
      throw new Error('Pilih tindakan pencairan.')
    },
    onSuccess: ({ data }) => { setAction(undefined); onChange(data) },
  })
  const positions = new Map(row.source_lines.map((line, index) => [line.id, index]))
  const columns: ColumnDef<SourceLine>[] = [
    { id: 'budget', header: 'Pos', size: 90, cell: ({ original }) => original.budget_code },
    { id: 'description', header: 'Deskripsi', size: 175, cell: ({ original }) => original.description },
    { id: 'amount', header: 'Nominal', size: 120, meta: { className: 'text-right tabular-nums whitespace-nowrap', headerClassName: 'text-right' }, cell: ({ original }) => disbursementAmount(original.amount_minor) },
  ]
  if (action === 'approve') {
    columns.push(...dimensions.map(({ id, type, label }): ColumnDef<SourceLine> => ({
      id, header: label, size: 170, cell: ({ original }) => {
        const index = positions.get(original.id)!
        return (
          <Controller name={`lines.${index}.${id}`} control={control} render={({ field }) => (
            <SearchableSelect value={field.value} onChange={field.onChange} onSearch={(q) => workspaceDisbursementApi.options(type, q)}
              triggerAriaLabel={label + ' untuk ' + original.description} placeholder={'Pilih ' + label.toLowerCase()}
              size="sm" error={errors.lines?.[index]?.[id]?.message} />
          )} />
        )
      },
    })))
  }
  const choose = (next?: Action) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    reset(defaults)
    mutation.reset()
    setAction(next)
  }
  const first = pagination.pageIndex * pagination.pageSize
  const payment = row.cash_payment
  const awaitingQc = row.qc_status !== 'approved'

  return (
    <form className="flex min-h-0 flex-col" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <div className="min-h-0 space-y-3 overflow-y-auto px-4 py-3">
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">RAB Workspace</dt><dd>#{row.workspace_document_id} · v{row.source_version}</dd></div>
          <div><dt className="text-muted-foreground">Unit</dt><dd>{row.unit_name}</dd></div>
          <div><dt className="text-muted-foreground">Tanggal kegiatan</dt><dd>{formatDate(row.activity_date)}</dd></div>
          <div><dt className="text-muted-foreground">Pencairan</dt><dd>{row.disbursed_on ? formatDate(row.disbursed_on) : 'Belum dicatat'}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{qcLabels[row.qc_status]}</dd></div>
          {row.payment_reference && <div><dt className="text-muted-foreground">Referensi pencairan</dt><dd>{row.payment_reference}</dd></div>}
          {payment && <div><dt className="text-muted-foreground">Kas keluar</dt><dd>{payment.payment_number}</dd></div>}
        </dl>
        {row.qc_note && <p className="whitespace-pre-wrap break-words text-sm">{row.qc_note}</p>}
        {action === 'record' && (
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Tanggal pencairan" htmlFor="workspace-disb-date" required error={errors.disbursed_on?.message}>
              <Input id="workspace-disb-date" type="date" max={todayInputValue()} {...register('disbursed_on')} />
            </FormField>
            <FormField label="Akun kas/bank" htmlFor="workspace-disb-cash" required error={errors.cash_bank_account_id?.message}>
              <Controller name="cash_bank_account_id" control={control} render={({ field }) => (
                <SearchableSelect value={field.value} onChange={field.onChange} onSearch={(q) => workspaceDisbursementApi.options('cash', q)}
                  triggerId="workspace-disb-cash" triggerAriaLabel="Akun kas/bank" placeholder="Pilih kas/bank" selectedOptions={row.cash_bank_account
                    ? [{ value: row.cash_bank_account.id, label: row.cash_bank_account.account_name, sublabel: row.cash_bank_account.account_code }] : []} />
              )} />
            </FormField>
            <FormField label="Referensi pencairan" htmlFor="workspace-disb-reference" required error={errors.payment_reference?.message}>
              <Input id="workspace-disb-reference" maxLength={160} {...register('payment_reference')} />
            </FormField>
          </div>
        )}
        <div className="max-h-64 overflow-auto rounded-md border border-border">
          <DataTable columns={columns} data={row.source_lines.slice(first, first + pagination.pageSize)} totalRows={row.source_lines.length}
            pagination={pagination} onPaginationChange={setPagination} />
        </div>
        {row.source_lines.some((_, index) => errors.lines?.[index]?.account_id) && <p role="alert" className="text-sm text-red-600">Pilih akun biaya untuk setiap baris.</p>}
        <p className="text-right text-sm font-semibold tabular-nums">Total {disbursementAmount(row.amount_minor)}</p>
        {action && action !== 'record' && (
          <FormField label={action === 'approve' ? 'Catatan QC' : 'Alasan'} htmlFor="workspace-qc-note" required={action !== 'approve'} error={errors.note?.message}>
            <Input id="workspace-qc-note" maxLength={1000} {...register('note')} />
          </FormField>
        )}
        {!action && row.history.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Riwayat pencairan dan QC</summary>
            <ol className="space-y-1 pt-2">{row.history.map((event, index) => (
              <li key={event.action + index}>{formatDate(event.created_at)} · {eventLabel[event.action] ?? event.action} · Pengguna #{event.user_id}
                {event.details.note && <span className="block text-muted-foreground">{event.details.note}</span>}
              </li>
            ))}</ol>
          </details>
        )}
        {mutation.error && <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(mutation.error, 'Tindakan gagal disimpan.')}</p>}
      </div>
      <DialogFooter className="shrink-0 flex-wrap gap-2 border-t border-border px-4 py-3">
        {action ? (
          <>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={choose()}>Kembali</Button>
            <Button type="submit" disabled={mutation.isPending}>{actionLabel[action]}</Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onClose}>Tutup</Button>
            {awaitingQc && can(disbursementPermissions.record) && <Button type="button" variant="outline" onClick={choose('record')}>{row.disbursed_on ? 'Koreksi pencairan' : 'Catat pencairan'}</Button>}
            {awaitingQc && can(disbursementPermissions.review) && <>
              <Button type="button" variant="outline" onClick={choose('reject')}>Kembalikan QC</Button>
              {row.disbursed_on && <Button type="button" onClick={choose('approve')}>Periksa dan setujui</Button>}
            </>}
            {payment?.status === 'draft' && can(disbursementPermissions.review) && <Button type="button" variant="outline" onClick={choose('reopen')}>Buka kembali QC</Button>}
            {payment && can('cash_bank.payments.view') && <Button type="button" onClick={() => {
              onClose()
              openRecordTab({ label: payment.payment_number, path: '/cash-bank/cash-payments/' + payment.id })
            }}>Buka kas keluar</Button>}
          </>
        )}
      </DialogFooter>
    </form>
  )
}
