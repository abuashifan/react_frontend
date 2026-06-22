import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { toDateInputValue } from '@/lib/utils'
import { useBankTransfer, useBankTransferMutations } from '../hooks/useCashBankList'
import { bankTransferSchema, type BankTransferFormValues } from '../schemas/cashBankSchemas'
import { cashBankAccountApi } from '../services/cashBankApi'
import type { DocumentStatus } from '@/types/common.types'

const createDefaults = (): BankTransferFormValues => ({
  transfer_date: new Date().toISOString().slice(0, 10),
  from_cash_bank_account_id: 0,
  to_cash_bank_account_id: 0,
  currency_code: 'IDR',
  exchange_rate: 1,
  amount: 0,
  notes: '',
})

export default function BankTransferFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const documentId = id ? Number(id) : undefined
  const isCreate = documentId === undefined
  const { toast } = useToast()
  const { can } = usePermission()
  const query = useBankTransfer(documentId)
  const transfer = query.data?.data
  const { create, update, post, void: voidTransfer } = useBankTransferMutations()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isPostOpen, setPostOpen] = useState(false)
  const form = useForm<BankTransferFormValues>({ resolver: zodResolver(bankTransferSchema), defaultValues: createDefaults() })
  const { control, getValues, register, handleSubmit, setValue, reset, setError, formState: { errors, isSubmitting } } = form
  const fromAccountId = useWatch({ control, name: 'from_cash_bank_account_id' })
  const toAccountId = useWatch({ control, name: 'to_cash_bank_account_id' })
  const status = (transfer?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || (transfer?.status === 'draft' && can('cash_bank.edit'))

  useEffect(() => {
    if (!transfer) return
    reset({
      transfer_date: toDateInputValue(transfer.transfer_date),
      from_cash_bank_account_id: transfer.from_cash_bank_account_id,
      to_cash_bank_account_id: transfer.to_cash_bank_account_id,
      currency_code: transfer.currency_code,
      exchange_rate: transfer.exchange_rate,
      amount: transfer.amount,
      notes: transfer.notes ?? '',
    })
  }, [transfer, reset])

  const formDraft = usePersistentFormDraft<BankTransferFormValues>({
    draftKey: `cash-bank.bank-transfer.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    enabled: isEditable,
  })

  const handleSave = handleSubmit(async (values) => {
    try {
      const response = isCreate
        ? await create.mutateAsync(values)
        : await update.mutateAsync({ id: documentId!, payload: values })
      formDraft.clearDraft()
      toast.success(isCreate ? 'Transfer bank berhasil dibuat.' : 'Transfer bank berhasil diperbarui.')
      if (isCreate) navigate(`/cash-bank/bank-transfers/${response.data.id}`)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan transfer bank.'))
    }
  })

  const handlePost = async () => {
    try {
      await post.mutateAsync(documentId!)
      formDraft.clearDraft()
      toast.success('Transfer bank berhasil diposting.')
      setPostOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal posting transfer bank.'))
    }
  }

  const handleVoid = async (reason: string) => {
    try {
      await voidTransfer.mutateAsync({ id: documentId!, reason })
      formDraft.clearDraft()
      toast.success('Transfer bank berhasil di-void.')
      setVoidOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal void transfer bank.'))
    }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can(isCreate ? 'cash_bank.transfer' : 'cash_bank.edit')) {
    actions.push({ id: 'save', label: isCreate ? 'Simpan' : 'Simpan Perubahan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting || update.isPending })
  }
  if (isEditable && formDraft.isRestored) {
    actions.push({ id: 'discard_draft', label: 'Buang Draft', variant: 'neutral', onClick: () => { reset(createDefaults()); formDraft.discardDraft() } })
  }
  if (!isCreate && transfer?.status === 'draft' && can('cash_bank.post')) {
    actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setPostOpen(true), isLoading: post.isPending })
  }
  if (!isCreate && transfer?.status === 'posted' && can('cash_bank.void')) {
    actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
  }

  if (!isCreate && query.isLoading) return <FormLayout title="Transfer Bank"><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>
  if (!isCreate && query.isError) {
    return <FormLayout title="Transfer Bank"><QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Transfer bank tidak dapat dimuat" /></FormLayout>
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Transfer Bank' : 'Transfer Bank'}
        documentNumber={transfer?.number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Transfer Bank', path: '/cash-bank/bank-transfers' }, { label: isCreate ? 'Buat' : (transfer?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={transfer?.number} actions={actions} />}
      >
        <FormSection title="Header">
          <div className="flex flex-col gap-1">
            <Label htmlFor="transfer-date">Tanggal <span className="text-red-500">*</span></Label>
            <Input id="transfer-date" {...register('transfer_date')} type="date" disabled={!isEditable} />
            {errors.transfer_date && <p className="text-[11px] text-red-500">{errors.transfer_date.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label>Dari Akun <span className="text-red-500">*</span></Label>
            <SearchableSelect value={fromAccountId || null} onChange={(value) => setValue('from_cash_bank_account_id', value ?? 0, { shouldValidate: true })} onSearch={cashBankAccountApi.search} placeholder="Pilih akun asal..." ariaLabel="Akun asal transfer" disabled={!isEditable} error={errors.from_cash_bank_account_id?.message} selectedOptions={transfer?.from_cash_bank_account ? [{ value: transfer.from_cash_bank_account.id, label: transfer.from_cash_bank_account.name, sublabel: transfer.from_cash_bank_account.code }] : []} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Ke Akun <span className="text-red-500">*</span></Label>
            <SearchableSelect value={toAccountId || null} onChange={(value) => setValue('to_cash_bank_account_id', value ?? 0, { shouldValidate: true })} onSearch={cashBankAccountApi.search} placeholder="Pilih akun tujuan..." ariaLabel="Akun tujuan transfer" disabled={!isEditable} error={errors.to_cash_bank_account_id?.message} selectedOptions={transfer?.to_cash_bank_account ? [{ value: transfer.to_cash_bank_account.id, label: transfer.to_cash_bank_account.name, sublabel: transfer.to_cash_bank_account.code }] : []} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="transfer-amount">Jumlah <span className="text-red-500">*</span></Label>
            <Input id="transfer-amount" {...register('amount', { valueAsNumber: true })} type="number" disabled={!isEditable} className="text-right tabular-nums" min={0.01} step="0.01" />
            {errors.amount && <p className="text-[11px] text-red-500">{errors.amount.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="transfer-currency">Mata Uang</Label>
            <Input id="transfer-currency" {...register('currency_code')} maxLength={3} disabled={!isEditable} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="transfer-rate">Kurs</Label>
            <Input id="transfer-rate" {...register('exchange_rate', { valueAsNumber: true })} type="number" min={0.000001} step="0.000001" disabled={!isEditable} className="text-right tabular-nums" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="transfer-notes">Catatan</Label>
            <Textarea id="transfer-notes" {...register('notes')} disabled={!isEditable} rows={2} />
          </div>
        </FormSection>
      </FormLayout>
      <ConfirmDialog open={isPostOpen} onOpenChange={setPostOpen} title="Post transfer bank?" description={`Transfer ${transfer?.number ?? ''} sebesar ${transfer?.amount.toLocaleString('id-ID') ?? 0} dari ${transfer?.from_cash_bank_account?.name ?? 'akun asal'} ke ${transfer?.to_cash_bank_account?.name ?? 'akun tujuan'} akan membuat jurnal.`} confirmLabel="Post" isLoading={post.isPending} onConfirm={() => void handlePost()} />
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={transfer?.number ?? ''} isLoading={voidTransfer.isPending} />
    </>
  )
}
