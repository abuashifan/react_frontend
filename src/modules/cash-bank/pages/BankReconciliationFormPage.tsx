import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RefreshCw } from 'lucide-react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, formatDate, toDateInputValue } from '@/lib/utils'
import { useBankReconciliation, useBankReconciliationMutations } from '../hooks/useCashBankList'
import { bankReconciliationSchema, type BankReconciliationFormValues } from '../schemas/cashBankSchemas'
import { cashBankAccountApi } from '../services/cashBankApi'
import type { DocumentStatus } from '@/types/common.types'

const today = () => new Date().toISOString().slice(0, 10)

const createDefaults = (): BankReconciliationFormValues => ({
  cash_bank_account_id: 0,
  statement_start_date: today(),
  statement_end_date: today(),
  statement_opening_balance: 0,
  statement_ending_balance: 0,
  notes: '',
})

export default function BankReconciliationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const documentId = id ? Number(id) : undefined
  const isCreate = documentId === undefined
  const { toast } = useToast()
  const { can } = usePermission()
  const query = useBankReconciliation(documentId)
  const reconciliation = query.data?.data
  const { create, update, refreshLines, markLines, finalize, reopen } = useBankReconciliationMutations()
  const [selectedLineIds, setSelectedLineIds] = useState<Set<number>>(new Set())
  const [clearedDate, setClearedDate] = useState('')
  const [confirmAction, setConfirmAction] = useState<'refresh' | 'finalize' | 'reopen' | null>(null)

  const form = useForm<BankReconciliationFormValues>({
    resolver: zodResolver(bankReconciliationSchema),
    defaultValues: createDefaults(),
  })
  const { control, getValues, register, handleSubmit, setValue, reset, setError, formState: { errors, isSubmitting, isDirty } } = form
  const values = useWatch({ control })
  const status = (reconciliation?.status ?? 'draft') as DocumentStatus
  const isDraft = isCreate || reconciliation?.status === 'draft'
  const canEdit = isDraft && can(isCreate ? 'cash_bank.create' : 'cash_bank.edit')

  useEffect(() => {
    if (!reconciliation) return
    const start = toDateInputValue(reconciliation.statement_start_date)
    const end = toDateInputValue(reconciliation.statement_end_date)
    reset({
      cash_bank_account_id: reconciliation.cash_bank_account_id,
      statement_start_date: start,
      statement_end_date: end,
      statement_opening_balance: reconciliation.statement_opening_balance,
      statement_ending_balance: reconciliation.statement_ending_balance,
      notes: reconciliation.notes ?? '',
    })
  }, [reconciliation, reset])

  const formDraft = usePersistentFormDraft<BankReconciliationFormValues>({
    draftKey: `cash-bank.bank-reconciliation.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    enabled: canEdit,
  })

  const handleSave = handleSubmit(async (formValues) => {
    try {
      if (isCreate) {
        const response = await create.mutateAsync(formValues)
        formDraft.clearDraft()
        toast.success('Rekonsiliasi bank berhasil dibuat.')
        navigate(`/cash-bank/bank-reconciliations/${response.data.id}`)
      } else {
        await update.mutateAsync({
          id: documentId!,
          payload: {
            statement_opening_balance: formValues.statement_opening_balance,
            statement_ending_balance: formValues.statement_ending_balance,
            notes: formValues.notes,
          },
        })
        formDraft.clearDraft()
        toast.success('Rekonsiliasi bank berhasil diperbarui.')
      }
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan rekonsiliasi bank.'))
    }
  })

  const handleRefresh = async () => {
    if (isDirty) {
      toast.warning('Simpan perubahan saldo/catatan sebelum memuat ulang transaksi.')
      setConfirmAction(null)
      return
    }
    try {
      await refreshLines.mutateAsync({ id: documentId! })
      toast.success('Transaksi dimuat ulang tanpa menghapus status cleared.')
      setConfirmAction(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal memuat ulang transaksi.'))
    }
  }

  const handleMark = async (cleared: boolean) => {
    if (selectedLineIds.size === 0) {
      toast.error('Pilih minimal satu transaksi.')
      return
    }
    try {
      await markLines.mutateAsync({
        id: documentId!,
        lineIds: Array.from(selectedLineIds),
        cleared,
        clearedDate: cleared ? (clearedDate || toDateInputValue(reconciliation?.statement_end_date)) : undefined,
      })
      toast.success(cleared ? 'Transaksi ditandai cleared.' : 'Transaksi ditandai uncleared.')
      setSelectedLineIds(new Set())
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal memperbarui status transaksi.'))
    }
  }

  const handleFinalize = async () => {
    try {
      await finalize.mutateAsync(documentId!)
      formDraft.clearDraft()
      toast.success('Rekonsiliasi bank berhasil difinalisasi.')
      setConfirmAction(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal finalisasi rekonsiliasi bank.'))
    }
  }

  const handleReopen = async (reason?: string) => {
    if (!reason) return
    try {
      await reopen.mutateAsync({ id: documentId!, reason })
      toast.success('Rekonsiliasi bank dibuka kembali.')
      setConfirmAction(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuka kembali rekonsiliasi bank.'))
    }
  }

  const clearedNet = (reconciliation?.lines ?? [])
    .filter((line) => line.is_cleared)
    .reduce((sum, line) => sum + line.debit - line.credit, 0)
  const difference = (reconciliation?.statement_opening_balance ?? Number(values.statement_opening_balance ?? 0))
    + clearedNet
    - (reconciliation?.statement_ending_balance ?? Number(values.statement_ending_balance ?? 0))

  const actions: DocumentActionButton[] = []
  if (canEdit) {
    actions.push({ id: 'save', label: isCreate ? 'Simpan' : 'Simpan Perubahan', variant: 'primary', onClick: () => void handleSave(), isLoading: isSubmitting || update.isPending })
  }
  if (canEdit && formDraft.isRestored) {
    actions.push({ id: 'discard_draft', label: 'Buang Draft', variant: 'neutral', onClick: () => { reset(createDefaults()); formDraft.discardDraft() } })
  }
  if (!isCreate && reconciliation?.status === 'draft' && can('cash_bank.edit')) {
    actions.push({ id: 'finalize', label: 'Finalisasi', variant: 'primary', onClick: () => setConfirmAction('finalize'), disabled: Math.abs(difference) > 0.01 })
  }
  if (!isCreate && reconciliation?.status === 'finalized' && can('cash_bank.edit')) {
    actions.push({ id: 'reopen', label: 'Buka Kembali', variant: 'secondary', onClick: () => setConfirmAction('reopen') })
  }

  if (!isCreate && query.isLoading) return <FormLayout title="Rekonsiliasi Bank"><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>
  if (!isCreate && query.isError) {
    return <FormLayout title="Rekonsiliasi Bank"><QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Rekonsiliasi bank tidak dapat dimuat" /></FormLayout>
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Rekonsiliasi Bank' : 'Rekonsiliasi Bank'}
        documentNumber={reconciliation?.number}
        status={status}
        readOnly={!isDraft}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Rekonsiliasi Bank', path: '/cash-bank/bank-reconciliations' }, { label: isCreate ? 'Buat' : (reconciliation?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={reconciliation?.number} actions={actions} />}
      >
        <div className="space-y-4">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label>Akun Bank <span className="text-red-500">*</span></Label>
              <SearchableSelect value={values.cash_bank_account_id || null} onChange={(value) => setValue('cash_bank_account_id', value ?? 0, { shouldValidate: true })} onSearch={cashBankAccountApi.search} placeholder="Pilih akun bank..." ariaLabel="Akun bank rekonsiliasi" disabled={!isCreate || !canEdit} error={errors.cash_bank_account_id?.message} selectedOptions={reconciliation?.cash_bank_account ? [{ value: reconciliation.cash_bank_account.id, label: reconciliation.cash_bank_account.name, sublabel: reconciliation.cash_bank_account.code }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="reconciliation-start">Tanggal Mulai <span className="text-red-500">*</span></Label>
              <Input id="reconciliation-start" {...register('statement_start_date')} type="date" disabled={!isCreate || !canEdit} />
              {errors.statement_start_date && <p className="text-[11px] text-red-500">{errors.statement_start_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="reconciliation-end">Tanggal Akhir <span className="text-red-500">*</span></Label>
              <Input id="reconciliation-end" {...register('statement_end_date')} type="date" min={values.statement_start_date} disabled={!isCreate || !canEdit} />
              {errors.statement_end_date && <p className="text-[11px] text-red-500">{errors.statement_end_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="reconciliation-opening">Saldo Awal Rekening Koran <span className="text-red-500">*</span></Label>
              <Input id="reconciliation-opening" {...register('statement_opening_balance', { valueAsNumber: true })} type="number" step="0.01" disabled={!canEdit} className="text-right tabular-nums" />
              {errors.statement_opening_balance && <p className="text-[11px] text-red-500">{errors.statement_opening_balance.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="reconciliation-ending">Saldo Akhir Rekening Koran <span className="text-red-500">*</span></Label>
              <Input id="reconciliation-ending" {...register('statement_ending_balance', { valueAsNumber: true })} type="number" step="0.01" disabled={!canEdit} className="text-right tabular-nums" />
              {errors.statement_ending_balance && <p className="text-[11px] text-red-500">{errors.statement_ending_balance.message}</p>}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label htmlFor="reconciliation-notes">Catatan</Label>
              <Textarea id="reconciliation-notes" {...register('notes')} disabled={!canEdit} rows={2} />
            </div>
          </FormSection>

          {!isCreate && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Transaksi ({reconciliation?.lines.length ?? 0})</p>
                {isDraft && can('cash_bank.edit') && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="cleared-date" className="sr-only">Tanggal cleared</Label>
                    <Input id="cleared-date" aria-label="Tanggal cleared" type="date" min={toDateInputValue(reconciliation?.statement_start_date)} max={toDateInputValue(reconciliation?.statement_end_date)} value={clearedDate || toDateInputValue(reconciliation?.statement_end_date)} onChange={(event) => setClearedDate(event.target.value)} className="h-7 w-36 text-[12px]" />
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => void handleMark(true)} disabled={markLines.isPending || selectedLineIds.size === 0}>Cleared</Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => void handleMark(false)} disabled={markLines.isPending || selectedLineIds.size === 0}>Uncleared</Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => setConfirmAction('refresh')} disabled={refreshLines.isPending}><RefreshCw className="mr-1 h-3 w-3" /> Muat Ulang</Button>
                  </div>
                )}
              </div>

              <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      {isDraft && <th className="w-9 px-3 py-2" aria-label="Pilih transaksi" />}
                      <th className="px-3 py-2 text-left">Tanggal</th>
                      <th className="px-3 py-2 text-left">Keterangan</th>
                      <th className="px-3 py-2 text-left">Sumber</th>
                      <th className="px-3 py-2 text-right">Masuk</th>
                      <th className="px-3 py-2 text-right">Keluar</th>
                      <th className="px-3 py-2 text-center">Cleared</th>
                      <th className="px-3 py-2 text-left">Tgl Cleared</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {(reconciliation?.lines ?? []).map((line) => (
                      <tr key={line.id} className={line.is_cleared ? 'bg-green-50/30' : undefined}>
                        {isDraft && <td className="px-3 py-2"><Checkbox aria-label={`Pilih transaksi ${line.journal_number}`} checked={selectedLineIds.has(line.id)} onCheckedChange={() => setSelectedLineIds((previous) => { const next = new Set(previous); if (next.has(line.id)) next.delete(line.id); else next.add(line.id); return next })} /></td>}
                        <td className="px-3 py-2">{formatDate(line.journal_date)}</td>
                        <td className="px-3 py-2">{line.description ?? '-'}</td>
                        <td className="px-3 py-2 text-[#64748b]">{line.journal_number}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-green-700">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                        <td className="px-3 py-2 text-center">{line.is_cleared ? '✓' : '—'}</td>
                        <td className="px-3 py-2">{line.cleared_date ? formatDate(line.cleared_date) : '-'}</td>
                      </tr>
                    ))}
                    {(reconciliation?.lines.length ?? 0) === 0 && <tr><td colSpan={isDraft ? 8 : 7} className="py-8 text-center text-[#94a3b8]">Belum ada transaksi pada periode ini.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="sticky bottom-14 z-20 mt-3 flex justify-end bg-[#EFEFED]/95 py-2">
                <div className="min-w-72 space-y-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="flex justify-between text-[12px]"><span>Saldo Awal</span><span className="tabular-nums">{formatCurrency(reconciliation?.statement_opening_balance ?? 0)}</span></div>
                  <div className="flex justify-between text-[12px]"><span>Mutasi Bersih Cleared</span><span className="tabular-nums">{formatCurrency(clearedNet)}</span></div>
                  <div className="flex justify-between text-[12px]"><span>Saldo Akhir Rekening Koran</span><span className="tabular-nums">{formatCurrency(reconciliation?.statement_ending_balance ?? 0)}</span></div>
                  <div className="flex justify-between border-t border-[#e2e8f0] pt-1 text-[12px]"><span className="font-semibold">Selisih</span><span className={`tabular-nums font-semibold ${Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(difference)}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormLayout>

      <ConfirmDialog open={confirmAction === 'refresh'} onOpenChange={(open) => setConfirmAction(open ? 'refresh' : null)} title="Muat ulang transaksi?" description="Transaksi baru akan ditambahkan dan transaksi yang tidak lagi eligible akan dihapus. Status cleared untuk journal line yang sama tetap dipertahankan." confirmLabel="Muat Ulang" isLoading={refreshLines.isPending} onConfirm={() => void handleRefresh()} />
      <ConfirmDialog open={confirmAction === 'finalize'} onOpenChange={(open) => setConfirmAction(open ? 'finalize' : null)} title="Finalisasi rekonsiliasi?" description={`Selisih saat ini ${formatCurrency(difference)}. Setelah finalisasi, saldo dan matching dikunci sampai rekonsiliasi dibuka kembali.`} confirmLabel="Finalisasi" isLoading={finalize.isPending} onConfirm={() => void handleFinalize()} />
      <ConfirmDialog open={confirmAction === 'reopen'} onOpenChange={(open) => setConfirmAction(open ? 'reopen' : null)} title="Buka kembali rekonsiliasi?" description="Rekonsiliasi akan kembali ke draft dan dapat diubah. Alasan dicatat untuk audit." confirmLabel="Buka Kembali" requireReason reasonLabel="Alasan buka kembali" isLoading={reopen.isPending} onConfirm={(reason) => void handleReopen(reason)} />
    </>
  )
}
