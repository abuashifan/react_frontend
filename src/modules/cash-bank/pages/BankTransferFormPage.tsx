import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { useBankTransfer, useBankTransferMutations } from '../hooks/useCashBankList'
import { bankTransferSchema, type BankTransferFormValues } from '../schemas/cashBankSchemas'
import { bankTransferApi } from '../services/cashBankApi'
import type { BankTransfer } from '../types/cashBank.types'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import { cn, fieldErrorClass, toDateInputValue } from '@/lib/utils'

export default function BankTransferFormPage() {
  const { id } = useParams()
  // `/cash-bank/bank-transfers/create` dan `/cash-bank/bank-transfers/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <BankTransferFormPageContent key={id ?? 'create'} />
}

function BankTransferFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useBankTransfer(id ? Number(id) : undefined)
  const transfer = data?.data
  const { create, post, void: voidTransfer } = useBankTransferMutations()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const { control, getValues, register, handleSubmit, setValue, reset, setError, formState: { errors, isSubmitting } } = useForm<BankTransferFormValues>({ resolver: zodResolver(bankTransferSchema), defaultValues: { transfer_date: new Date().toISOString().slice(0, 10) } })
  const fromAccountId = useWatch({ control, name: 'from_cash_bank_account_id' })
  const toAccountId = useWatch({ control, name: 'to_cash_bank_account_id' })
  const status = (transfer?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate

  useEffect(() => {
    if (transfer) {
      reset({ transfer_date: toDateInputValue(transfer.transfer_date), from_cash_bank_account_id: transfer.from_cash_bank_account_id, to_cash_bank_account_id: transfer.to_cash_bank_account_id, amount: transfer.amount, notes: transfer.notes ?? '' })
    }
  }, [transfer, reset])

  const formDraft = usePersistentFormDraft<BankTransferFormValues>({
    draftKey: `cash-bank.bank-transfer.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    enabled: isEditable,
  })

  const handleDiscardDraft = () => {
    reset({ transfer_date: new Date().toISOString().slice(0, 10) })
    formDraft.discardDraft()
    formDraft.clearDraft()
    toast.success('Draft lokal dibuang.')
  }

  const { saveAndClose, navProps } = useRecordFormNavigation<BankTransferFormValues, BankTransfer>({
    id,
    basePath: '/cash-bank/bank-transfers',
    createLabel: 'Transfer Bank Baru',
    getRecordLabel: (record) => record.number,
    sequenceQueryKey: ['cash-bank', 'transfers', 'sequence'],
    fetchAll: async () => (await bankTransferApi.listAll()).data,
    handleSubmit,
    save: async (values) => {
      await create.mutateAsync(values)
    },
    onSaved: () => formDraft.clearDraft(),
    successMessage: () => 'Transfer bank berhasil dibuat.',
    onError: (saveError) => {
      // Tandai field penyebab dari backend supaya user tahu isian mana yang salah,
      // bukan hanya toast generik "Gagal menyimpan".
      applyApiValidationErrors(saveError, setError)
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan transfer bank.'))
    },
    canSave: isEditable,
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); formDraft.clearDraft(); toast.success('Diposting.') } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal posting.')) } }
  const handleVoid = async (reason: string) => { await voidTransfer.mutateAsync({ id: Number(id), reason }); formDraft.clearDraft(); toast.success('Berhasil di-void.'); setVoidOpen(false) }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('cash_bank.create')) actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  if (isEditable && formDraft.isRestored) actions.push({ id: 'discard_draft', label: 'Buang Draft', variant: 'neutral', onClick: handleDiscardDraft })
  if (!isCreate && transfer?.status === 'draft' && can('cash_bank.post')) actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
  if (!isCreate && transfer?.status === 'posted' && can('cash_bank.void')) actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })

  if (!isCreate && isLoading) return <FormLayout title="Transfer Bank" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Transfer Bank', path: '/cash-bank/bank-transfers' }, { label: 'Memuat...' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>

  return (
    <>
      <FormLayout title={isCreate ? 'Buat Transfer Bank' : 'Transfer Bank'} documentNumber={transfer?.number} status={status} readOnly={!isEditable}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Transfer Bank', path: '/cash-bank/bank-transfers' }, { label: isCreate ? 'Buat' : (transfer?.number ?? '') }]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={transfer?.number} actions={actions} />
          </>
        }>
        <FormSection title="Header">
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label><Input {...register('transfer_date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.transfer_date))} /><FieldError message={errors.transfer_date?.message} /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Akun <span className="text-red-500">*</span></Label><SearchableSelect value={fromAccountId ?? null} onChange={(v) => setValue('from_cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun asal..." disabled={!isEditable} error={errors.from_cash_bank_account_id?.message} selectedOptions={transfer?.from_cash_bank_account ? [{ value: transfer.from_cash_bank_account.id, label: transfer.from_cash_bank_account.name }] : []} /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Ke Akun <span className="text-red-500">*</span></Label><SearchableSelect value={toAccountId ?? null} onChange={(v) => setValue('to_cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun tujuan..." disabled={!isEditable} error={errors.to_cash_bank_account_id?.message} selectedOptions={transfer?.to_cash_bank_account ? [{ value: transfer.to_cash_bank_account.id, label: transfer.to_cash_bank_account.name }] : []} /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah <span className="text-red-500">*</span></Label><Input {...register('amount', { valueAsNumber: true })} type="number" disabled={!isEditable} className={cn('h-9 text-[13px] text-right tabular-nums', fieldErrorClass(errors.amount))} min={0} /><FieldError message={errors.amount?.message} /></div>
          <div className="flex flex-col gap-1 md:col-span-2"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label><Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} /><FieldError message={errors.notes?.message} /></div>
        </FormSection>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={transfer?.number ?? ''} isLoading={voidTransfer.isPending} />
    </>
  )
}
