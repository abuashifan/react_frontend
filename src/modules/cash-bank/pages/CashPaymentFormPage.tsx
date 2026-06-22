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
import { useCashPayment, useCashPaymentMutations } from '../hooks/useCashBankList'
import { cashPaymentSchema, EMPTY_CASH_ALLOCATION_LINE, type CashPaymentFormValues } from '../schemas/cashBankSchemas'
import { cashBankAccountApi } from '../services/cashBankApi'
import { CashAllocationTable } from '../components/CashAllocationTable'
import type { DocumentStatus } from '@/types/common.types'

const createDefaults = (): CashPaymentFormValues => ({
  payment_date: new Date().toISOString().slice(0, 10),
  cash_bank_account_id: 0,
  contact_id: null,
  currency_code: 'IDR',
  exchange_rate: 1,
  amount: 0,
  notes: '',
  lines: [{ ...EMPTY_CASH_ALLOCATION_LINE }],
})

export default function CashPaymentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const documentId = id ? Number(id) : undefined
  const isCreate = documentId === undefined
  const { toast } = useToast()
  const { can } = usePermission()
  const query = useCashPayment(documentId)
  const payment = query.data?.data
  const { create, update, post, void: voidPayment } = useCashPaymentMutations()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isPostOpen, setPostOpen] = useState(false)
  const form = useForm<CashPaymentFormValues>({ resolver: zodResolver(cashPaymentSchema), defaultValues: createDefaults() })
  const { control, getValues, register, handleSubmit, setValue, reset, setError, formState: { errors, isSubmitting } } = form
  const { append, remove } = useFieldArray({ control, name: 'lines' })
  const values = useWatch({ control })
  const status = (payment?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || (payment?.status === 'draft' && can('cash_bank.edit'))
  const lineTotal = (values.lines ?? []).reduce((sum, line) => sum + Number(line?.amount ?? 0), 0)

  useEffect(() => {
    if (!payment) return
    reset({
      payment_date: toDateInputValue(payment.payment_date),
      cash_bank_account_id: payment.cash_bank_account_id,
      contact_id: payment.contact_id,
      currency_code: payment.currency_code,
      exchange_rate: payment.exchange_rate,
      amount: payment.amount,
      notes: payment.notes ?? '',
      lines: payment.lines.map((line) => ({
        account_id: line.account_id,
        amount: line.amount,
        description: line.description ?? '',
        department_id: line.department_id ?? null,
        project_id: line.project_id ?? null,
      })),
    })
  }, [payment, reset])

  const handleSave = handleSubmit(async (formValues) => {
    try {
      const response = isCreate
        ? await create.mutateAsync(formValues)
        : await update.mutateAsync({ id: documentId!, payload: formValues })
      toast.success(isCreate ? 'Pengeluaran kas berhasil dibuat.' : 'Pengeluaran kas berhasil diperbarui.')
      if (isCreate) navigate(`/cash-bank/cash-payments/${response.data.id}`)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan pengeluaran kas.'))
    }
  })

  const handlePost = async () => {
    try {
      await post.mutateAsync(documentId!)
      toast.success('Pengeluaran kas berhasil diposting.')
      setPostOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal posting pengeluaran kas.'))
    }
  }

  const handleVoid = async (reason: string) => {
    try {
      await voidPayment.mutateAsync({ id: documentId!, reason })
      toast.success('Pengeluaran kas berhasil di-void.')
      setVoidOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal void pengeluaran kas.'))
    }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can(isCreate ? 'cash_bank.create' : 'cash_bank.edit')) {
    actions.push({ id: 'save', label: isCreate ? 'Simpan' : 'Simpan Perubahan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting || update.isPending })
  }
  if (!isCreate && payment?.status === 'draft' && can('cash_bank.post')) {
    actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setPostOpen(true), isLoading: post.isPending })
  }
  if (!isCreate && payment?.status === 'posted' && can('cash_bank.void')) {
    actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
  }

  if (!isCreate && query.isLoading) return <FormLayout title="Pengeluaran Kas"><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>
  if (!isCreate && query.isError) {
    return <FormLayout title="Pengeluaran Kas"><QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Pengeluaran kas tidak dapat dimuat" /></FormLayout>
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Pengeluaran Kas' : 'Pengeluaran Kas'}
        documentNumber={payment?.number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Pengeluaran Kas', path: '/cash-bank/cash-payments' }, { label: isCreate ? 'Buat' : (payment?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={payment?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label htmlFor="payment-date">Tanggal <span className="text-red-500">*</span></Label>
              <Input id="payment-date" {...register('payment_date')} type="date" disabled={!isEditable} />
              {errors.payment_date && <p className="text-[11px] text-red-500">{errors.payment_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Akun Kas/Bank <span className="text-red-500">*</span></Label>
              <SearchableSelect value={values.cash_bank_account_id || null} onChange={(value) => setValue('cash_bank_account_id', value ?? 0, { shouldValidate: true })} onSearch={cashBankAccountApi.search} placeholder="Pilih akun kas/bank..." ariaLabel="Akun kas atau bank pengeluaran" disabled={!isEditable} error={errors.cash_bank_account_id?.message} selectedOptions={payment?.cash_bank_account ? [{ value: payment.cash_bank_account.id, label: payment.cash_bank_account.name, sublabel: payment.cash_bank_account.code }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Kontak</Label>
              <SearchableSelect value={values.contact_id ?? null} onChange={(value) => setValue('contact_id', value)} onSearch={kontakApi.search} placeholder="Pilih kontak..." ariaLabel="Kontak pengeluaran kas" disabled={!isEditable} selectedOptions={payment?.contact ? [{ value: payment.contact.id, label: payment.contact.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="payment-amount">Jumlah <span className="text-red-500">*</span></Label>
              <Input id="payment-amount" {...register('amount', { valueAsNumber: true })} type="number" disabled={!isEditable} className="text-right tabular-nums" min={0.01} step="0.01" />
              {errors.amount && <p className="text-[11px] text-red-500">{errors.amount.message}</p>}
              <p className={`text-[11px] tabular-nums ${Math.abs(lineTotal - Number(values.amount ?? 0)) < 0.01 ? 'text-green-700' : 'text-red-600'}`}>Total alokasi: {lineTotal.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="payment-currency">Mata Uang</Label>
              <Input id="payment-currency" {...register('currency_code')} maxLength={3} disabled={!isEditable} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="payment-rate">Kurs</Label>
              <Input id="payment-rate" {...register('exchange_rate', { valueAsNumber: true })} type="number" min={0.000001} step="0.000001" disabled={!isEditable} className="text-right tabular-nums" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label htmlFor="payment-notes">Catatan</Label>
              <Textarea id="payment-notes" {...register('notes')} disabled={!isEditable} rows={2} />
            </div>
          </FormSection>
          <CashAllocationTable
            items={(values.lines ?? []) as CashPaymentFormValues['lines']}
            sourceLines={payment?.lines}
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
      <ConfirmDialog open={isPostOpen} onOpenChange={setPostOpen} title="Post pengeluaran kas?" description={`Dokumen ${payment?.number ?? ''} sebesar ${payment?.amount.toLocaleString('id-ID') ?? 0} akan membuat jurnal pada akun ${payment?.cash_bank_account?.name ?? 'kas/bank'}.`} confirmLabel="Post" isLoading={post.isPending} onConfirm={() => void handlePost()} />
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={payment?.number ?? ''} isLoading={voidPayment.isPending} />
    </>
  )
}
