import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormField } from '@/components/shared/form/FormField'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { useBankTransfer, useBankTransferMutations } from '../hooks/useCashBankList'
import { bankTransferSchema, type BankTransferFormValues } from '../schemas/cashBankSchemas'
import { bankTransferApi } from '../services/cashBankApi'
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
  const transferAmount = useWatch({ control, name: 'amount' })
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

  const { saveAndClose, navProps } = useRecordFormNavigation<BankTransferFormValues>({
    id,
    basePath: '/cash-bank/bank-transfers',
    createLabel: 'Transfer Bank Baru',
    sequenceQueryKey: ['cash-bank', 'transfers', 'adjacent'],
    fetchAdjacent: async (recordId) => (await bankTransferApi.adjacent(recordId)).data,
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
        <div className="space-y-2.5 [@media(max-height:620px)]:space-y-2">
          <section className="rounded-lg border border-[#d9e2e5] bg-white px-3 py-2.5 lg:px-4 [@media(max-height:620px)]:py-2">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <FormField label="Tgl. Transfer" htmlFor="transfer-date" required error={errors.transfer_date?.message} className="w-[160px]">
                <Input
                  id="transfer-date"
                  {...register('transfer_date')}
                  type="date"
                  disabled={!isEditable}
                  className={cn('h-8 text-[12px]', fieldErrorClass(errors.transfer_date))}
                />
              </FormField>

              <FormField label="Dari Akun" required error={errors.from_cash_bank_account_id?.message} className="w-[240px]">
                <SearchableSelect value={fromAccountId ?? null} onChange={(v) => setValue('from_cash_bank_account_id', v as number)} onSearch={(q) => coaApi.search(q, { is_cash_bank: true })} placeholder="Pilih akun asal..." disabled={!isEditable} size="sm" selectedOptions={transfer?.from_cash_bank_account ? [{ value: transfer.from_cash_bank_account.id, label: transfer.from_cash_bank_account.name, sublabel: transfer.from_cash_bank_account.code }] : []} />
              </FormField>

              <FormField label="Ke Akun" required error={errors.to_cash_bank_account_id?.message} className="w-[240px]">
                <SearchableSelect value={toAccountId ?? null} onChange={(v) => setValue('to_cash_bank_account_id', v as number)} onSearch={(q) => coaApi.search(q, { is_cash_bank: true })} placeholder="Pilih akun tujuan..." disabled={!isEditable} size="sm" selectedOptions={transfer?.to_cash_bank_account ? [{ value: transfer.to_cash_bank_account.id, label: transfer.to_cash_bank_account.name, sublabel: transfer.to_cash_bank_account.code }] : []} />
              </FormField>

              <FormField label="Jumlah" required error={errors.amount?.message} className="w-[180px]">
                <AmountInput
                  value={transferAmount ?? 0}
                  onChange={(v) => setValue('amount', v)}
                  disabled={!isEditable}
                  decimals={2}
                  ariaLabel="Jumlah transfer"
                />
              </FormField>
            </div>
          </section>

          <FormField label="Catatan" htmlFor="transfer-notes" error={errors.notes?.message}>
            <Textarea
              id="transfer-notes"
              {...register('notes')}
              disabled={!isEditable}
              placeholder="Catatan..."
              rows={2}
              className={cn('min-h-[58px] resize-none text-[12px]', fieldErrorClass(errors.notes))}
            />
          </FormField>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={transfer?.number ?? ''} isLoading={voidTransfer.isPending} />
    </>
  )
}
