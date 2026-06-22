import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
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
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { toDateInputValue } from '@/lib/utils'
import { useCashReceipt, useCashReceiptMutations } from '../hooks/useCashBankList'
import { cashReceiptSchema, EMPTY_CASH_ALLOCATION_LINE, type CashReceiptFormValues } from '../schemas/cashBankSchemas'
import { cashBankAccountApi } from '../services/cashBankApi'
import { CashAllocationTable } from '../components/CashAllocationTable'
import type { DocumentStatus } from '@/types/common.types'

const createDefaults = (): CashReceiptFormValues => ({
  receipt_date: new Date().toISOString().slice(0, 10),
  cash_bank_account_id: 0,
  contact_id: null,
  currency_code: 'IDR',
  exchange_rate: 1,
  amount: 0,
  notes: '',
  lines: [{ ...EMPTY_CASH_ALLOCATION_LINE }],
})

export default function CashReceiptFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const documentId = id ? Number(id) : undefined
  const isCreate = documentId === undefined
  const { toast } = useToast()
  const { can } = usePermission()
  const query = useCashReceipt(documentId)
  const receipt = query.data?.data
  const { create, update, post, void: voidReceipt } = useCashReceiptMutations()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isPostOpen, setPostOpen] = useState(false)

  const form = useForm<CashReceiptFormValues>({
    resolver: zodResolver(cashReceiptSchema),
    defaultValues: createDefaults(),
  })
  const { control, getValues, register, handleSubmit, setValue, reset, setError, formState: { errors, isSubmitting } } = form
  const { append, remove } = useFieldArray({ control, name: 'lines' })
  const values = useWatch({ control })
  const status = (receipt?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || (receipt?.status === 'draft' && can('cash_bank.edit'))
  const lineTotal = (values.lines ?? []).reduce((sum, line) => sum + Number(line?.amount ?? 0), 0)

  useEffect(() => {
    if (!receipt) return
    reset({
      receipt_date: toDateInputValue(receipt.receipt_date),
      cash_bank_account_id: receipt.cash_bank_account_id,
      contact_id: receipt.contact_id,
      currency_code: receipt.currency_code,
      exchange_rate: receipt.exchange_rate,
      amount: receipt.amount,
      notes: receipt.notes ?? '',
      lines: receipt.lines.map((line) => ({
        account_id: line.account_id,
        amount: line.amount,
        description: line.description ?? '',
        department_id: line.department_id ?? null,
        project_id: line.project_id ?? null,
      })),
    })
  }, [receipt, reset])

  const handleSave = handleSubmit(async (formValues) => {
    try {
      const response = isCreate
        ? await create.mutateAsync(formValues)
        : await update.mutateAsync({ id: documentId!, payload: formValues })
      toast.success(isCreate ? 'Penerimaan kas berhasil dibuat.' : 'Penerimaan kas berhasil diperbarui.')
      if (isCreate) navigate(`/cash-bank/cash-receipts/${response.data.id}`)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan penerimaan kas.'))
    }
  })

  const handlePost = async () => {
    try {
      await post.mutateAsync(documentId!)
      toast.success('Penerimaan kas berhasil diposting.')
      setPostOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal posting penerimaan kas.'))
    }
  }

  const handleVoid = async (reason: string) => {
    try {
      await voidReceipt.mutateAsync({ id: documentId!, reason })
      toast.success('Penerimaan kas berhasil di-void.')
      setVoidOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal void penerimaan kas.'))
    }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can(isCreate ? 'cash_bank.create' : 'cash_bank.edit')) {
    actions.push({ id: 'save', label: isCreate ? 'Simpan' : 'Simpan Perubahan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting || update.isPending })
  }
  if (!isCreate && receipt?.status === 'draft' && can('cash_bank.post')) {
    actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setPostOpen(true), isLoading: post.isPending })
  }
  if (!isCreate && receipt?.status === 'posted' && can('cash_bank.void')) {
    actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
  }

  if (!isCreate && query.isLoading) {
    return <FormLayout title="Penerimaan Kas"><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>
  }
  if (!isCreate && query.isError) {
    return (
      <FormLayout title="Penerimaan Kas">
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Penerimaan kas tidak dapat dimuat" />
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Penerimaan Kas' : 'Penerimaan Kas'}
        documentNumber={receipt?.number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Penerimaan Kas', path: '/cash-bank/cash-receipts' }, { label: isCreate ? 'Buat' : (receipt?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={receipt?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label htmlFor="receipt-date">Tanggal <span className="text-red-500">*</span></Label>
              <Input id="receipt-date" {...register('receipt_date')} type="date" disabled={!isEditable} />
              {errors.receipt_date && <p className="text-[11px] text-red-500">{errors.receipt_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Akun Kas/Bank <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={values.cash_bank_account_id || null}
                onChange={(value) => setValue('cash_bank_account_id', value ?? 0, { shouldValidate: true })}
                onSearch={cashBankAccountApi.search}
                placeholder="Pilih akun kas/bank..."
                ariaLabel="Akun kas atau bank penerimaan"
                disabled={!isEditable}
                error={errors.cash_bank_account_id?.message}
                selectedOptions={receipt?.cash_bank_account ? [{ value: receipt.cash_bank_account.id, label: receipt.cash_bank_account.name, sublabel: receipt.cash_bank_account.code }] : []}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Kontak</Label>
              <SearchableSelect
                value={values.contact_id ?? null}
                onChange={(value) => setValue('contact_id', value)}
                onSearch={kontakApi.search}
                placeholder="Pilih kontak..."
                ariaLabel="Kontak penerimaan kas"
                disabled={!isEditable}
                selectedOptions={receipt?.contact ? [{ value: receipt.contact.id, label: receipt.contact.name }] : []}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="receipt-amount">Jumlah <span className="text-red-500">*</span></Label>
              <Input id="receipt-amount" {...register('amount', { valueAsNumber: true })} type="number" disabled={!isEditable} className="text-right tabular-nums" min={0.01} step="0.01" />
              {errors.amount && <p className="text-[11px] text-red-500">{errors.amount.message}</p>}
              <p className={`text-[11px] tabular-nums ${Math.abs(lineTotal - Number(values.amount ?? 0)) < 0.01 ? 'text-green-700' : 'text-red-600'}`}>Total alokasi: {lineTotal.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="receipt-currency">Mata Uang</Label>
              <Input id="receipt-currency" {...register('currency_code')} maxLength={3} disabled={!isEditable} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="receipt-rate">Kurs</Label>
              <Input id="receipt-rate" {...register('exchange_rate', { valueAsNumber: true })} type="number" min={0.000001} step="0.000001" disabled={!isEditable} className="text-right tabular-nums" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label htmlFor="receipt-notes">Catatan</Label>
              <Textarea id="receipt-notes" {...register('notes')} disabled={!isEditable} rows={2} />
            </div>
          </FormSection>
          <CashAllocationTable
            items={(values.lines ?? []) as CashReceiptFormValues['lines']}
            sourceLines={receipt?.lines}
            isReadOnly={!isEditable}
            lineErrors={errors.lines}
            error={errors.lines?.root?.message ?? (typeof errors.lines?.message === 'string' ? errors.lines.message : undefined)}
            onAdd={() => append({ ...EMPTY_CASH_ALLOCATION_LINE })}
            onRemove={remove}
            onUpdate={(index, field, value) => {
              const next = [...getValues('lines')]
              next[index] = { ...next[index], [field]: value }
              setValue('lines', next, { shouldDirty: true, shouldValidate: true })
            }}
          />
        </div>
      </FormLayout>
      <ConfirmDialog
        open={isPostOpen}
        onOpenChange={setPostOpen}
        title="Post penerimaan kas?"
        description={`Dokumen ${receipt?.number ?? ''} sebesar ${receipt?.amount.toLocaleString('id-ID') ?? 0} akan membuat jurnal pada akun ${receipt?.cash_bank_account?.name ?? 'kas/bank'}.`}
        confirmLabel="Post"
        isLoading={post.isPending}
        onConfirm={() => void handlePost()}
      />
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={receipt?.number ?? ''} isLoading={voidReceipt.isPending} />
    </>
  )
}
