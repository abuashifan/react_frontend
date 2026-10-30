import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { DeleteDocumentDialog } from '@/components/shared/document/DeleteDocumentDialog'
import { useTransactionEditMode } from '@/modules/settings/hooks/useTransactionEditMode'
import { useRecordTab } from '@/hooks/useRecordTab'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { FieldError } from '@/components/shared/form/FieldError'
import { cn, fieldErrorClass, formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useVendorDeposit, useVendorDepositMutations } from '../hooks/useVendorDepositList'
import { toVendorDepositPayload } from '../services/vendorDepositAdapter'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { vendorDepositSchema, type VendorDepositFormValues } from '../schemas/vendorDepositSchema'
import { vendorDepositApi } from '../services/vendorDepositApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import { useState } from 'react'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { DocumentHistoryButton } from '@/modules/accounting/components/DocumentHistoryButton'
import { DocumentPrintDialog } from '@/components/shared/print/DocumentPrintDialog'
import { vendorDepositPrint } from '../print/purchasePrint'

export default function VendorDepositFormPage() {
  const { id } = useParams()
  // `/purchase/vendor-deposits/create` dan `/purchase/vendor-deposits/:id` merender komponen
  // yang sama, dan React Router tidak me-remount otomatis saat berpindah di antara keduanya
  // (hanya param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <VendorDepositFormPageContent key={id ?? 'create'} />
}

function VendorDepositFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [printOpen, setPrintOpen] = useState(false)
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // Mode open: dokumen yang sudah berefek dibuka untuk diedit lewat tombol Edit.
  const [editing, setEditing] = useState(false)

  const { data, isLoading } = useVendorDeposit(id ? Number(id) : undefined)
  const deposit = data?.data
  const isEditable = isCreate || deposit?.status === 'draft' || editing
  const { create, post, void: voidDep, remove, update } = useVendorDepositMutations()
  const { canChange } = useTransactionEditMode()
  const { closeRecordTab } = useRecordTab()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<VendorDepositFormValues>({
    resolver: zodResolver(vendorDepositSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const status = (deposit?.status ?? 'draft') as DocumentStatus

  useEffect(() => {
    if (deposit) {
      reset({ vendor_id: deposit.vendor_id, date: deposit.date, cash_bank_account_id: deposit.cash_bank_account_id, amount: deposit.amount, notes: deposit.notes ?? '' })
    }
  }, [deposit, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<VendorDepositFormValues>({
    draftKey: `purchase.vendor-deposit.${id ?? 'new'}`,
    control,
    getValues,
    reset,
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<VendorDepositFormValues>({
    id,
    basePath: '/purchase/vendor-deposits',
    createLabel: 'Deposit Vendor Baru',
    sequenceQueryKey: ['purchase', 'vendor-deposits', 'adjacent'],
    fetchAdjacent: async (recordId) => (await vendorDepositApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values, creating) => {
      const payload = toVendorDepositPayload(values)
      if (creating) await create.mutateAsync(payload)
      else await update.mutateAsync({ id: Number(id), payload })
    },
    onSaved: () => {
      formDraft.clearDraft()
      setEditing(false)
    },
    successMessage: () => 'Deposit vendor berhasil dibuat.',
    onError: (saveError) => {
      // Backend memakai nama kolom DB (`deposit_date`), form memakai `date`.
      applyApiValidationErrors(saveError, setError, { deposit_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan deposit vendor.'))
    },
    // Deposit tersimpan langsung terposting: hanya form create yang bisa disimpan.
    canSave: isEditable,
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Deposit berhasil diposting.') } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal posting deposit.')) } }
  const handleVoid = async (reason: string) => {
    await voidDep.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Deposit berhasil di-void.')
    setVoidOpen(false)
  }

  const handleDelete = async (reason?: string) => {
    try {
      await remove.mutateAsync({ id: Number(id), reason })
      toast.success('Deposit vendor berhasil dihapus.')
      setDeleteOpen(false)
      closeRecordTab(window.location.pathname, '/purchase/vendor-deposits')
    } catch (deleteError) { toast.error(getApiErrorMessage(deleteError, 'Gagal menghapus deposit vendor.')) }
  }

  const actions: DocumentActionButton[] = []
  if (!isCreate && deposit && can('purchase.deposits.print')) {
    actions.push({ id: 'print', label: 'Cetak', variant: 'neutral', onClick: () => setPrintOpen(true) })
  }
  if (!isCreate && canChange(deposit?.status)) {
    if (deposit?.status !== 'draft' && !editing && can('purchase.deposits.edit')) {
      actions.push({ id: 'edit', label: 'Edit', variant: 'secondary', onClick: () => setEditing(true) })
    }
    if (can('purchase.deposits.delete')) actions.push({ id: 'delete', label: 'Hapus', variant: 'destructive', onClick: () => setDeleteOpen(true) })
  }
  if (editing) {
    actions.push({ id: 'cancel_edit', label: 'Batal Edit', variant: 'neutral', onClick: () => setEditing(false) })
  }
  if (isEditable && can(isCreate ? 'purchase.deposits.create' : 'purchase.deposits.edit')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (deposit?.status === 'draft' && can('purchase.deposits.approve')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (deposit?.status === 'posted' && can('purchase.deposits.delete')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Deposit Vendor" breadcrumb={[{ label: 'Pembelian' }, { label: 'Deposit Vendor', path: '/purchase/vendor-deposits' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Deposit Vendor' : 'Deposit Vendor'}
        documentNumber={deposit?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Deposit Vendor', path: '/purchase/vendor-deposits' }, { label: isCreate ? 'Buat Deposit' : (deposit?.number ?? '') }]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentHistoryButton documentType="vendor_deposit" documentId={id} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={deposit?.number} actions={actions} />
          </>
        }
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('vendor_id') ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isEditable} error={errors.vendor_id?.message} selectedOptions={deposit?.vendor ? [{ value: deposit.vendor.id, label: deposit.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
              <FieldError message={errors.date?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('cash_bank_account_id') ?? null} onChange={(v) => setValue('cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun kas/bank..." disabled={!isEditable} error={errors.cash_bank_account_id?.message} selectedOptions={deposit?.cash_bank_account ? [{ value: deposit.cash_bank_account.id, label: `${deposit.cash_bank_account.code} - ${deposit.cash_bank_account.name}` }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah <span className="text-red-500">*</span></Label>
              <Input {...register('amount', { valueAsNumber: true })} type="number" disabled={!isEditable} className={cn('h-9 text-[13px] tabular-nums text-right', fieldErrorClass(errors.amount))} min={0} />
              <FieldError message={errors.amount?.message} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} />
              <FieldError message={errors.notes?.message} />
            </div>
          </FormSection>

          {!isCreate && deposit && (
            <FormSection title="Alokasi">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah Deposit</span>
                <span className="tabular-nums text-[13px]">{formatCurrency(deposit.amount)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dialokasikan</span>
                <span className="tabular-nums text-[13px]">{formatCurrency(deposit.allocated_amount)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sisa</span>
                <span className="tabular-nums text-[13px] font-semibold text-[#5c9ead]">{formatCurrency(deposit.remaining_amount)}</span>
              </div>
            </FormSection>
          )}
        </div>
      </FormLayout>

      <DeleteDocumentDialog isOpen={isDeleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={(reason) => void handleDelete(reason)} documentNumber={deposit?.number ?? ''} hasEffects={!['draft'].includes(deposit?.status ?? 'draft')} isLoading={remove.isPending} />
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={deposit?.number ?? ''} isLoading={voidDep.isPending} />
      <DocumentPrintDialog open={printOpen} onClose={() => setPrintOpen(false)} data={deposit ? vendorDepositPrint(deposit) : null} defaultPaper="half-a4" />
    </>
  )
}
