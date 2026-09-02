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
import { AmountInput } from '@/components/shared/form/AmountInput'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { cn, fieldErrorClass, formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useVendorPayment, useVendorOpenBills, useVendorPaymentMutations } from '../hooks/useVendorPaymentList'
import { toVendorPaymentPayload } from '../services/vendorPaymentAdapter'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { vendorPaymentSchema, type VendorPaymentFormValues } from '../schemas/vendorPaymentSchema'
import { vendorPaymentApi } from '../services/vendorPaymentApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import type { VendorPaymentLinePayload } from '../types/vendorPayment.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface BillLine {
  vendor_bill_id: number
  bill_number: string
  balance_due: number
  amount: number
}

export default function VendorPaymentFormPage() {
  const { id } = useParams()
  // `/purchase/payments/create` dan `/purchase/payments/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <VendorPaymentFormPageContent key={id ?? 'create'} />
}

function VendorPaymentFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [billLines, setBillLines] = useState<BillLine[]>([])

  const { data, isLoading } = useVendorPayment(id ? Number(id) : undefined)
  const payment = data?.data
  const { create, post, void: voidPayment } = useVendorPaymentMutations()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<VendorPaymentFormValues>({
    resolver: zodResolver(vendorPaymentSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const vendorId = watch('vendor_id')
  const { data: vendorContextData } = useVendorOpenBills(isCreate ? vendorId : null)
  const openBills = vendorContextData?.data?.open_bills ?? []

  const status = (payment?.status ?? 'draft') as DocumentStatus
  const totalAmount = billLines.reduce((s, l) => s + l.amount, 0)

  useEffect(() => {
    if (payment) {
      reset({ vendor_id: payment.vendor_id, date: payment.date, cash_bank_account_id: payment.cash_bank_account_id, amount: payment.amount, notes: payment.notes ?? '' })
      setBillLines(payment.lines.map((l) => ({ vendor_bill_id: l.vendor_bill_id, bill_number: l.bill_number ?? '', balance_due: l.balance_due ?? 0, amount: l.amount })))
    }
  }, [payment, reset])

  useEffect(() => {
    if (isCreate) {
      setBillLines([])
    }
  }, [vendorId, isCreate])

  useEffect(() => {
    if (totalAmount > 0) setValue('amount', totalAmount)
  }, [totalAmount, setValue])

  const handleAddBill = (billId: number) => {
    const bill = openBills.find((b) => b.vendor_bill_id === billId)
    if (bill && !billLines.find((l) => l.vendor_bill_id === billId)) {
      setBillLines((prev) => [...prev, { vendor_bill_id: bill.vendor_bill_id, bill_number: bill.bill_number, balance_due: bill.balance_due, amount: bill.balance_due }])
    }
  }

  const billColumns: LineItemColumn<BillLine>[] = [
    {
      id: 'bill_number',
      header: 'Nomor Bill',
      width: 180,
      render: ({ item }) => <span className="text-[12px] font-medium text-[#5c9ead]">{item.bill_number}</span>,
    },
    {
      id: 'balance_due',
      header: 'Sisa Tagihan',
      width: 140,
      align: 'right',
      render: ({ item }) => <span className="text-[12px] tabular-nums">{formatCurrency(item.balance_due)}</span>,
    },
    {
      id: 'amount',
      header: 'Dibayar',
      width: 140,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px] tabular-nums">{formatCurrency(item.amount)}</span>
        ) : (
          <AmountInput
            value={item.amount}
            onChange={(v) => onUpdate('amount', v)}
            
            decimals={2}
            ariaLabel="Jumlah"
            className={cn(FLUSH_INPUT_CLASS, 'text-right')}
          />
        ),
    },
  ]


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<VendorPaymentFormValues>({
    draftKey: `purchase.vendor-payment.${id ?? 'new'}`,
    control,
    getValues,
    reset,
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<VendorPaymentFormValues>({
    id,
    basePath: '/purchase/payments',
    createLabel: 'Pembayaran Vendor Baru',
    sequenceQueryKey: ['purchase', 'payments', 'adjacent'],
    fetchAdjacent: async (recordId) => (await vendorPaymentApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values) => {
      const lines: VendorPaymentLinePayload[] = billLines.map((l) => ({ vendor_bill_id: l.vendor_bill_id, amount: l.amount }))
      await create.mutateAsync({ ...toVendorPaymentPayload(values), lines })
    },
    onSaved: () => formDraft.clearDraft(),
    successMessage: () => 'Pembayaran vendor berhasil dibuat.',
    onError: (saveError) => {
      // Backend memakai nama kolom DB (`payment_date`), form memakai `date`.
      applyApiValidationErrors(saveError, setError, { payment_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan pembayaran vendor.'))
    },
    // Pembayaran tersimpan langsung terposting: hanya form create yang bisa disimpan.
    canSave: isCreate,
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Pembayaran berhasil diposting.') } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal posting pembayaran.')) } }
  const handleVoid = async (reason: string) => {
    await voidPayment.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Pembayaran berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('purchase.payments.create')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (payment?.status === 'draft' && can('purchase.payments.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (payment?.status === 'posted' && can('purchase.payments.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Pembayaran Vendor" breadcrumb={[{ label: 'Pembelian' }, { label: 'Pembayaran', path: '/purchase/payments' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Pembayaran Vendor' : 'Pembayaran Vendor'}
        documentNumber={payment?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Pembayaran', path: '/purchase/payments' }, { label: isCreate ? 'Buat Pembayaran' : (payment?.number ?? '') }]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={payment?.number} actions={actions} />
          </>
        }
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('vendor_id') ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isCreate} error={errors.vendor_id?.message} selectedOptions={payment?.vendor ? [{ value: payment.vendor.id, label: payment.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isCreate} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
              <FieldError message={errors.date?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('cash_bank_account_id') ?? null} onChange={(v) => setValue('cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun kas/bank..." disabled={!isCreate} error={errors.cash_bank_account_id?.message} selectedOptions={payment?.cash_bank_account ? [{ value: payment.cash_bank_account.id, label: `${payment.cash_bank_account.code} - ${payment.cash_bank_account.name}` }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total Pembayaran</Label>
              <Input {...register('amount', { valueAsNumber: true })} type="number" disabled className={cn('h-9 text-[13px] tabular-nums text-right', fieldErrorClass(errors.amount))} />
              <FieldError message={errors.amount?.message} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isCreate} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} />
              <FieldError message={errors.notes?.message} />
            </div>
          </FormSection>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tagihan yang Dibayar</p>
              {isCreate && vendorId && openBills.length > 0 && (
                <SearchableSelect
                  value={null}
                  onChange={(v) => { if (v) handleAddBill(v as number) }}
                  onSearch={async (q) => openBills.filter((b) => b.bill_number.includes(q)).map((b) => ({ value: b.vendor_bill_id, label: b.bill_number, sublabel: formatCurrency(b.balance_due) }))}
                  placeholder="Tambah tagihan..."
                  size="sm"
                />
              )}
            </div>
            {/* Baris ditambahkan lewat `SearchableSelect` "Tambah tagihan..." di atas
                (bukan baris kosong), jadi tombol "+ Tambah Item" bawaan tabel tidak dipakai. */}
            <LineItemsTable<BillLine>
              items={billLines}
              columns={billColumns}
              onRemove={(index) => setBillLines((prev) => prev.filter((_, idx) => idx !== index))}
              onUpdate={(index, field, value) => setBillLines((prev) => prev.map((l, idx) => (idx === index ? { ...l, [field]: value } : l)))}
              isReadOnly={!isCreate}
              emptyLabel="Belum ada tagihan dipilih"
              footer={billLines.length === 0 ? undefined : (_items, cellCount) => (
                <tr>
                  <td colSpan={cellCount - 2} className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                    Total
                  </td>
                  <td className="px-2.5 py-2 text-right text-[13px] font-semibold tabular-nums text-[#24323a]">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td />
                </tr>
              )}
            />
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={payment?.number ?? ''} isLoading={voidPayment.isPending} />
    </>
  )
}
