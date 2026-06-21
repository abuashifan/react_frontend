import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage, isApiNotFound } from '@/lib/apiError'
import { formatCurrency, toDateInputValue } from '@/lib/utils'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { useCompanySettings, useCompanyWorkflow } from '@/modules/settings/hooks/useCompanySettings'
import { useJournalEntry, useJournalEntryMutations } from '../hooks/useJournalEntryList'
import { journalEntrySchema, type JournalEntryFormValues, type JournalLineFormValues } from '../schemas/journalEntrySchema'
import type { DocumentStatus } from '@/types/common.types'

const EMPTY_LINE: JournalLineFormValues = {
  account_id: null,
  account_option: null,
  department_id: null,
  department_option: null,
  project_id: null,
  project_option: null,
  description: '',
  debit: 0,
  credit: 0,
}

export default function JournalFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const query = useJournalEntry(id ? Number(id) : undefined)
  const journal = query.data?.data
  const { create, update, approve, post, void: voidJournal } = useJournalEntryMutations()

  const settings = useCompanySettings().data?.data
  const workflow = useCompanyWorkflow().data?.data
  const precision = settings?.accounting?.amount_precision ?? 2
  const moneyStep = precision > 0 ? (1 / 10 ** precision).toFixed(precision) : '1'
  const roundMoney = (value: number) => {
    const factor = 10 ** precision
    return Math.round((value + Number.EPSILON) * factor) / factor
  }

  const [isVoidOpen, setVoidOpen] = useState(false)

  const { control, register, handleSubmit, reset, setValue, setError, getValues, formState: { errors, isSubmitting } } =
    useForm<JournalEntryFormValues>({
      resolver: zodResolver(journalEntrySchema),
      defaultValues: {
        journal_date: new Date().toISOString().slice(0, 10),
        description: '',
        edit_reason: '',
        lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
      },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const watchedLines = (useWatch({ control, name: 'lines' }) ?? []) as JournalLineFormValues[]

  const totalDebit = watchedLines.reduce((sum, line) => sum + (Number(line?.debit) || 0), 0)
  const totalCredit = watchedLines.reduce((sum, line) => sum + (Number(line?.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001

  const isSystem = !!journal?.is_system_generated
  const isPosted = journal?.status === 'posted'
  const allowEditPosted = settings?.accounting?.allow_edit_posted_transactions ?? false
  const canEditPosted = !isCreate && isPosted && allowEditPosted && can('journal.edit') && !isSystem
  const isEditable = !isSystem && (isCreate || journal?.status === 'draft' || canEditPosted)
  const status = (journal?.status ?? 'draft') as DocumentStatus

  // Draft persistence hanya untuk create (A13-055).
  const { clearDraft } = usePersistentFormDraft<JournalEntryFormValues>({
    draftKey: 'journal-create',
    control,
    getValues,
    reset,
    enabled: isCreate,
  })

  useEffect(() => {
    if (journal) {
      reset({
        journal_date: toDateInputValue(journal.journal_date),
        description: journal.description ?? '',
        edit_reason: '',
        lines: journal.lines.map((line) => ({
          account_id: line.account_id,
          account_option: line.account
            ? { value: line.account.id, label: `${line.account.account_code} - ${line.account.account_name}`, sublabel: line.account.account_code }
            : line.account_id != null
              ? { value: line.account_id, label: `Akun #${line.account_id}` }
              : null,
          department_id: line.department_id ?? null,
          department_option: line.department ? { value: line.department.id, label: line.department.name } : null,
          project_id: line.project_id ?? null,
          project_option: line.project ? { value: line.project.id, label: line.project.name } : null,
          description: line.description ?? '',
          debit: line.debit ?? 0,
          credit: line.credit ?? 0,
        })),
      })
    }
  }, [journal, reset])

  const buildLinePayloads = (values: JournalEntryFormValues) =>
    values.lines.map((line, i) => ({
      account_id: line.account_id as number,
      department_id: line.department_id ?? null,
      project_id: line.project_id ?? null,
      description: line.description || null,
      debit: line.debit || undefined,
      credit: line.credit || undefined,
      line_order: i + 1,
    }))

  const handleSave = handleSubmit(async (values) => {
    const lines = buildLinePayloads(values)
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ journal_date: values.journal_date, description: values.description || null, lines })
        clearDraft()
        toast.success('Jurnal berhasil dibuat.')
        navigate(`/accounting/journals/${res.data.id}`)
      } else {
        await update.mutateAsync({
          id: Number(id),
          payload: {
            journal_date: values.journal_date,
            description: values.description || null,
            lines,
            ...(canEditPosted ? { edit_reason: values.edit_reason || undefined } : {}),
          },
        })
        toast.success('Jurnal berhasil diperbarui.')
      }
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan jurnal.'))
    }
  })

  const handleApprove = async () => {
    try { await approve.mutateAsync(Number(id)); toast.success('Jurnal di-approve.') } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal approve.')) }
  }
  const handlePost = async () => {
    if (!isBalanced) { toast.error('Total debit harus sama dengan total kredit.'); return }
    try { await post.mutateAsync(Number(id)); toast.success('Jurnal berhasil diposting.') } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal posting jurnal.')) }
  }
  const handleVoid = async (reason: string) => {
    try {
      await voidJournal.mutateAsync({ id: Number(id), reason })
      toast.success('Jurnal berhasil di-void.')
      setVoidOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal void jurnal.'))
    }
  }

  const lineError = (index: number, field: keyof JournalLineFormValues) => errors.lines?.[index]?.[field]?.message

  const columns: LineItemColumn<JournalLineFormValues>[] = [
    {
      id: 'account', header: 'Akun', width: 200,
      render: ({ index, isReadOnly }) => (
        <div className="flex flex-col gap-1">
          <SearchableSelect
            value={watchedLines[index]?.account_id ?? null}
            onChange={(v, opt) => { setValue(`lines.${index}.account_id`, v, { shouldDirty: true }); setValue(`lines.${index}.account_option`, opt ?? null) }}
            onSearch={(q) => coaApi.search(q, { isActive: true })}
            placeholder="Pilih akun..."
            disabled={isReadOnly}
            size="sm"
            ariaLabel={`Akun baris ${index + 1}`}
            selectedOptions={watchedLines[index]?.account_option ? [watchedLines[index].account_option!] : []}
          />
          {lineError(index, 'account_id') && <p className="text-[11px] text-red-500">{lineError(index, 'account_id')}</p>}
        </div>
      ),
    },
    {
      id: 'department', header: 'Departemen', width: 150,
      render: ({ index, isReadOnly }) => (
        <SearchableSelect
          value={watchedLines[index]?.department_id ?? null}
          onChange={(v, opt) => { setValue(`lines.${index}.department_id`, v, { shouldDirty: true }); setValue(`lines.${index}.department_option`, opt ?? null) }}
          onSearch={departemenApi.search}
          placeholder="Opsional..."
          disabled={isReadOnly}
          size="sm"
          ariaLabel={`Departemen baris ${index + 1}`}
          selectedOptions={watchedLines[index]?.department_option ? [watchedLines[index].department_option!] : []}
        />
      ),
    },
    {
      id: 'project', header: 'Proyek', width: 150,
      render: ({ index, isReadOnly }) => (
        <SearchableSelect
          value={watchedLines[index]?.project_id ?? null}
          onChange={(v, opt) => { setValue(`lines.${index}.project_id`, v, { shouldDirty: true }); setValue(`lines.${index}.project_option`, opt ?? null) }}
          onSearch={proyekApi.search}
          placeholder="Opsional..."
          disabled={isReadOnly}
          size="sm"
          ariaLabel={`Proyek baris ${index + 1}`}
          selectedOptions={watchedLines[index]?.project_option ? [watchedLines[index].project_option!] : []}
        />
      ),
    },
    {
      id: 'description', header: 'Keterangan', width: 160,
      render: ({ index, isReadOnly }) => (
        <Input
          {...register(`lines.${index}.description`)}
          disabled={isReadOnly}
          placeholder="Keterangan..."
          aria-label={`Keterangan baris ${index + 1}`}
          className="h-8 text-[12px]"
        />
      ),
    },
    {
      id: 'debit', header: 'Debit', width: 120, align: 'right',
      render: ({ index, isReadOnly }) => (
        <div className="flex flex-col gap-1">
          <Input
            type="number" min={0} step={moneyStep}
            value={watchedLines[index]?.debit || ''}
            onChange={(e) => { setValue(`lines.${index}.debit`, roundMoney(Number(e.target.value) || 0), { shouldDirty: true }); setValue(`lines.${index}.credit`, 0) }}
            disabled={isReadOnly}
            aria-label={`Debit baris ${index + 1}`}
            className="h-8 text-right text-[12px]"
            placeholder="0"
          />
          {lineError(index, 'debit') && <p className="text-[11px] text-red-500">{lineError(index, 'debit')}</p>}
        </div>
      ),
    },
    {
      id: 'credit', header: 'Kredit', width: 120, align: 'right',
      render: ({ index, isReadOnly }) => (
        <Input
          type="number" min={0} step={moneyStep}
          value={watchedLines[index]?.credit || ''}
          onChange={(e) => { setValue(`lines.${index}.credit`, roundMoney(Number(e.target.value) || 0), { shouldDirty: true }); setValue(`lines.${index}.debit`, 0) }}
          disabled={isReadOnly}
          aria-label={`Kredit baris ${index + 1}`}
          className="h-8 text-right text-[12px]"
          placeholder="0"
        />
      ),
    },
  ]

  const canSave = isCreate ? can('journal.create') : can('journal.edit')
  const saveLabel = isCreate
    ? (workflow?.transaction_workflow_mode === 'simple_auto_post' ? 'Simpan & Posting' : 'Simpan Draft')
    : 'Simpan Perubahan'

  const actions: DocumentActionButton[] = []
  if (!isSystem) {
    if (isEditable && canSave) {
      actions.push({ id: 'save', label: saveLabel, variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
    }
    if (!isCreate) {
      if (journal?.status === 'draft' && workflow?.transaction_workflow_mode === 'draft_approve_post' && can('journal.approve')) {
        actions.push({ id: 'approve', label: 'Approve', variant: 'secondary', onClick: () => void handleApprove(), isLoading: approve.isPending })
      }
      const canPostNow = workflow?.transaction_workflow_mode === 'draft_approve_post'
        ? journal?.status === 'approved'
        : ['draft', 'approved'].includes(journal?.status ?? '')
      if (canPostNow && can('journal.post')) {
        actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
      }
      if (['draft', 'approved', 'posted'].includes(journal?.status ?? '') && can('journal.void')) {
        actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
      }
    }
  }

  if (!isCreate && query.isLoading) {
    return (
      <FormLayout title="Jurnal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal', path: '/accounting/journals' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  if (!isCreate && query.isError) {
    const notFound = isApiNotFound(query.error)
    return (
      <FormLayout title="Jurnal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal', path: '/accounting/journals' }, { label: notFound ? 'Tidak ditemukan' : 'Error' }]}>
        <QueryErrorState
          error={query.error}
          onRetry={() => void query.refetch()}
          title={notFound ? 'Jurnal tidak ditemukan' : 'Jurnal gagal dimuat'}
          fallbackMessage={notFound ? 'Jurnal yang Anda cari tidak ada atau telah dihapus.' : 'Periksa koneksi lalu coba lagi.'}
        />
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Jurnal' : 'Jurnal Umum'}
        documentNumber={journal?.journal_number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal', path: '/accounting/journals' }, { label: isCreate ? 'Buat Jurnal' : (journal?.journal_number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={journal?.journal_number} actions={actions} />}
      >
        <div className="space-y-3">
          {isSystem && (
            <div className="flex items-center gap-2 rounded-lg border border-[#cbd5e1] bg-[#f1f5f9] px-3 py-2">
              <Badge className="bg-[#475569] text-white hover:bg-[#475569]">System Generated</Badge>
              <span className="text-[12px] text-[#475569]">
                Jurnal otomatis dari {journal?.source_type ?? 'sistem'}{journal?.source_number ? ` (${journal.source_number})` : ''}. Tidak dapat diedit langsung.
              </span>
            </div>
          )}

          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label htmlFor="journal_date" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input id="journal_date" {...register('journal_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.journal_date && <p className="text-[11px] text-red-500">{errors.journal_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label htmlFor="journal_description" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</Label>
              <Textarea id="journal_description" {...register('description')} disabled={!isEditable} placeholder="Deskripsi jurnal..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          {canEditPosted && (
            <FormSection title="Revisi">
              <div className="flex flex-col gap-1 md:col-span-3">
                <Label htmlFor="edit_reason" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alasan Revisi <span className="text-red-500">*</span></Label>
                <Input id="edit_reason" {...register('edit_reason')} placeholder="Alasan mengedit jurnal yang sudah diposting..." className="h-9 text-[13px]" />
                <p className="text-[11px] text-[#64748b]">Wajib diisi untuk mengedit jurnal yang sudah diposting.</p>
              </div>
            </FormSection>
          )}

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Baris Jurnal</p>
            <LineItemsTable
              items={fields} columns={columns}
              onAdd={() => append({ ...EMPTY_LINE })}
              onRemove={(i) => remove(i)}
              onUpdate={() => { /* per-field updates handled inline via setValue */ }}
              isReadOnly={!isEditable} addLabel="Tambah Baris"
            />
            {typeof errors.lines?.message === 'string' && <p className="mt-1 text-[11px] text-red-500">{errors.lines.message}</p>}
            <div className="mt-2 flex justify-end gap-8 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 text-[12px]">
              <div className="flex gap-2">
                <span className="text-[#64748b]">Total Debit:</span>
                <span className="tabular-nums font-semibold text-[#334155]">{formatCurrency(totalDebit)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#64748b]">Total Kredit:</span>
                <span className="tabular-nums font-semibold text-[#334155]">{formatCurrency(totalCredit)}</span>
              </div>
              {!isBalanced && (
                <span className="font-semibold text-red-500">⚠ Tidak seimbang: {formatCurrency(Math.abs(totalDebit - totalCredit))}</span>
              )}
            </div>
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={journal?.journal_number ?? ''} isLoading={voidJournal.isPending} />
    </>
  )
}
