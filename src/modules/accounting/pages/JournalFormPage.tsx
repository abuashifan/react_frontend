import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, toDateInputValue } from '@/lib/utils'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { useJournalEntry, useJournalEntryMutations } from '../hooks/useJournalEntryList'
import { journalEntrySchema, type JournalEntryFormValues } from '../schemas/journalEntrySchema'
import type { DocumentStatus, SelectOption } from '@/types/common.types'
import type { BudgetWarning } from '../types/journalEntry.types'

interface EditableLine {
  account_id: number | null
  /** Preloaded option agar SearchableSelect bisa menampilkan label akun existing. */
  account_option: SelectOption<number> | null
  description: string
  debit: number
  credit: number
}

const DEFAULT_LINE: EditableLine = { account_id: null, account_option: null, description: '', debit: 0, credit: 0 }

export default function JournalFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useJournalEntry(id ? Number(id) : undefined)
  const journal = data?.data
  const { create, update, approve, post, void: voidJournal } = useJournalEntryMutations()

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: { journal_date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE, DEFAULT_LINE])
  const [isVoidOpen, setVoidOpen] = useState(false)

  const status = (journal?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || journal?.status === 'draft'

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001

  useEffect(() => {
    if (journal) {
      reset({ journal_date: toDateInputValue(journal.journal_date), description: journal.description ?? '' })
      // Detail load is the source of truth for editable line state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines(journal.lines.map((l) => ({
        account_id: l.account_id,
        account_option: l.account
          ? { value: l.account.id, label: `${l.account.account_code} - ${l.account.account_name}`, sublabel: l.account.account_code }
          : { value: l.account_id, label: `Akun #${l.account_id}` },
        description: l.description ?? '',
        debit: l.debit ?? 0,
        credit: l.credit ?? 0,
      })))
    }
  }, [journal, reset])

  const handleSave = handleSubmit(async (values) => {
    const linePayloads = lines.map((l, i) => ({ account_id: l.account_id!, description: l.description || null, debit: l.debit || undefined, credit: l.credit || undefined, line_order: i + 1 }))
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines: linePayloads })
        toast.success('Jurnal berhasil dibuat.')
        navigate(`/accounting/journals/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines: linePayloads } })
        toast.success('Jurnal berhasil diperbarui.')
      }
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan jurnal.'))
    }
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); toast.success('Jurnal di-approve.') } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal approve.')) } }
  const handlePost = async () => {
    if (!isBalanced) { toast.error('Total debit harus sama dengan total kredit.'); return }
    try {
      const res = await post.mutateAsync(Number(id))
      toast.success('Jurnal berhasil diposting.')
      const warnings = (res.meta?.warnings ?? []) as BudgetWarning[]
      warnings.forEach((w) => {
        toast.warning(
          `Anggaran terlampaui: akun #${w.account_id} — realisasi ${formatCurrency(w.new_total)} dari anggaran ${formatCurrency(w.budget_amount)} (lebih ${formatCurrency(w.overage)})`,
        )
      })
    } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal posting jurnal.')) }
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

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'account', header: 'Akun', width: 220,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect value={item.account_id} onChange={(v) => onUpdate('account_id', v)} onSearch={coaApi.search} placeholder="Pilih akun..." disabled={isReadOnly} size="sm" selectedOptions={item.account_option ? [item.account_option] : []} />
      ),
    },
    { id: 'description', header: 'Keterangan', width: 180, render: ({ item, isReadOnly, onUpdate }) => <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Keterangan..." className="h-8 text-[12px]" /> },
    {
      id: 'debit', header: 'Debit', width: 130, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.debit || ''} onChange={(e) => { onUpdate('debit', Number(e.target.value)); onUpdate('credit', 0) }} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} placeholder="0" />
      ),
    },
    {
      id: 'credit', header: 'Kredit', width: 130, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.credit || ''} onChange={(e) => { onUpdate('credit', Number(e.target.value)); onUpdate('debit', 0) }} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} placeholder="0" />
      ),
    },
  ]

  const actions: DocumentActionButton[] = []
  if (isEditable && can('journal.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (journal?.status === 'draft' && can('journal.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'secondary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (['draft', 'approved'].includes(journal?.status ?? '') && can('journal.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (['draft', 'approved', 'posted'].includes(journal?.status ?? '') && can('journal.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Jurnal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Jurnal', path: '/accounting/journals' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
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
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('journal_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.journal_date && <p className="text-[11px] text-red-500">{errors.journal_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</Label>
              <Textarea {...register('description')} disabled={!isEditable} placeholder="Deskripsi jurnal..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Baris Jurnal</p>
            <LineItemsTable
              items={lines} columns={columns}
              onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
              onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))}
              isReadOnly={!isEditable} addLabel="Tambah Baris"
            />
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
