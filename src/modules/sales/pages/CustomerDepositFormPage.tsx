import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { useCustomerDeposit, useCustomerDepositMutations } from '../hooks/useCustomerDepositList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { customerDepositSchema, type CustomerDepositFormValues } from '../schemas/customerDepositSchema'
import { customerDepositApi } from '../services/customerDepositApi'
import type { CustomerDeposit } from '../types/customerDeposit.types'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import { cn, fieldErrorClass, formatCurrency } from '@/lib/utils'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

export default function CustomerDepositFormPage() {
  const { id } = useParams()
  // `/sales/customer-deposits/create` dan `/sales/customer-deposits/:id` merender komponen
  // yang sama, dan React Router tidak me-remount otomatis saat berpindah di antara keduanya
  // (hanya param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <CustomerDepositFormPageContent key={id ?? 'create'} />
}

function CustomerDepositFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useCustomerDeposit(id ? Number(id) : undefined)
  const deposit = data?.data
  const { create, post, void: voidDep } = useCustomerDepositMutations()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<CustomerDepositFormValues>({
    resolver: zodResolver(customerDepositSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [isVoidOpen, setVoidOpen] = useState(false)

  const status = (deposit?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate

  useEffect(() => {
    if (deposit) {
      reset({
        customer_id: deposit.customer_id,
        date: deposit.date,
        cash_bank_account_id: deposit.cash_bank_account_id,
        amount: deposit.amount,
        notes: deposit.notes ?? '',
      })
    }
  }, [deposit, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<CustomerDepositFormValues>({
    draftKey: `sales.customer-deposit.${id ?? 'new'}`,
    control,
    getValues,
    reset,
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<CustomerDepositFormValues, CustomerDeposit>({
    id,
    basePath: '/sales/customer-deposits',
    createLabel: 'Deposit Baru',
    getRecordLabel: (record) => record.number,
    sequenceQueryKey: ['sales', 'customer-deposits', 'sequence'],
    fetchAll: async () => (await customerDepositApi.listAll()).data,
    handleSubmit,
    save: async (values) => {
      await create.mutateAsync(values)
    },
    onSaved: () => formDraft.clearDraft(),
    successMessage: () => 'Deposit berhasil disimpan.',
    onError: (saveError) => {
      // Backend memvalidasi tanggal sebagai `deposit_date`, form memakai `date`.
      applyApiValidationErrors(saveError, setError, { deposit_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan deposit.'))
    },
    // Deposit tersimpan langsung terposting: hanya form create yang bisa disimpan.
    canSave: isEditable,
  })

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Deposit berhasil diposting.')
    } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal memposting deposit.')) }
  }

  const handleVoid = async (reason: string) => {
    await voidDep.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Deposit berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('sales.deposits.create')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (deposit?.status === 'draft' && can('sales.deposits.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (deposit?.status === 'posted' && can('sales.deposits.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Deposit Customer" breadcrumb={[{ label: 'Sales' }, { label: 'Deposit Customer', path: '/sales/customer-deposits' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Deposit Customer' : 'Deposit Customer'}
        documentNumber={deposit?.number}
        status={status}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Deposit Customer', path: '/sales/customer-deposits' },
          { label: isCreate ? 'Buat Deposit' : (deposit?.number ?? '') },
        ]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={deposit?.number} actions={actions} />
          </>
        }
      >
        <div className="space-y-3">
          <FormSection title="Informasi Deposit">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Customer <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={watch('customer_id') ?? null}
                onChange={(v) => setValue('customer_id', v as number)}
                onSearch={(q) => kontakApi.search(q, 'customer')}
                placeholder="Pilih customer..."
                disabled={!isEditable}
                error={errors.customer_id?.message}
                selectedOptions={deposit?.customer ? [{ value: deposit.customer.id, label: deposit.customer.name }] : []}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
              <FieldError message={errors.date?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Akun Kas/Bank <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={watch('cash_bank_account_id') ?? null}
                onChange={(v) => setValue('cash_bank_account_id', v as number)}
                onSearch={coaApi.search}
                placeholder="Pilih akun..."
                disabled={!isEditable}
                error={errors.cash_bank_account_id?.message}
                selectedOptions={deposit?.cash_bank_account ? [{ value: deposit.cash_bank_account.id, label: deposit.cash_bank_account.name, sublabel: deposit.cash_bank_account.code }] : []}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Jumlah <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                min={0}
                disabled={!isEditable}
                className={cn('h-9 text-[13px] text-right tabular-nums', fieldErrorClass(errors.amount))}
                placeholder="0"
              />
              <FieldError message={errors.amount?.message} />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} />
              <FieldError message={errors.notes?.message} />
            </div>
          </FormSection>

          {deposit && (
            <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Ringkasan Alokasi</p>
              <div className="space-y-1 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Total Deposit</span>
                  <span className="tabular-nums font-medium">{formatCurrency(deposit.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Terpakai</span>
                  <span className="tabular-nums text-[#991B1B]">{formatCurrency(deposit.allocated_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-[#d9e2e5] pt-1 font-semibold">
                  <span>Sisa</span>
                  <span className="tabular-nums text-[#065F46]">{formatCurrency(deposit.remaining_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormLayout>

      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={deposit?.number ?? ''}
        isLoading={voidDep.isPending}
      />
    </>
  )
}
