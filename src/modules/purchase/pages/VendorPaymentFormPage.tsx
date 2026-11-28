import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { SettlementDiscountCell, SettlementDiscountDialog, type SettlementDiscount, type SettlementDiscountSelection } from '@/components/shared/form/SettlementDiscountDialog'
import { FieldError } from '@/components/shared/form/FieldError'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { cn, fieldErrorClass, formatCurrency, todayInputValue } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useVendorPayment, useVendorOpenBills, useVendorPaymentMutations, useVendorPaymentCashBalance } from '../hooks/useVendorPaymentList'
import { toVendorPaymentPayload } from '../services/vendorPaymentAdapter'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { vendorPaymentSchema, type VendorPaymentFormValues } from '../schemas/vendorPaymentSchema'
import { vendorPaymentApi } from '../services/vendorPaymentApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { DeleteDocumentDialog } from '@/components/shared/document/DeleteDocumentDialog'
import { useTransactionEditMode } from '@/modules/settings/hooks/useTransactionEditMode'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import type { VendorPaymentLinePayload } from '../types/vendorPayment.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { DocumentHistoryButton } from '@/modules/accounting/components/DocumentHistoryButton'
import { DocumentPrintDialog } from '@/components/shared/print/DocumentPrintDialog'
import { vendorPaymentPrint } from '../print/purchasePrint'

interface BillLine extends SettlementDiscount {
  vendor_bill_id: number
  bill_number: string
  balance_due: number
  amount: number
  grand_total?: number
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
  const [printOpen, setPrintOpen] = useState(false)
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // Draft selalu bisa diedit; yang sudah posted (mode open) dibuka lewat tombol Edit.
  const [editing, setEditing] = useState(false)
  const [billLines, setBillLines] = useState<BillLine[]>([])
  const [discountSelection, setDiscountSelection] = useState<SettlementDiscountSelection>()
  const discountLine = billLines.find((line) => line.vendor_bill_id === discountSelection?.id)
  const [billSearch, setBillSearch] = useState('')
  const [billPage, setBillPage] = useState(1)

  const { data, isLoading } = useVendorPayment(id ? Number(id) : undefined)
  const payment = data?.data
  const { create, update, post, void: voidPayment, remove } = useVendorPaymentMutations()
  const { canChange } = useTransactionEditMode()
  const { closeRecordTab } = useRecordTab()

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorPaymentFormValues>({
    resolver: zodResolver(vendorPaymentSchema),
    defaultValues: { date: todayInputValue() },
  })

  const isEditable = isCreate || payment?.status === 'draft' || editing
  const vendorId = watch('vendor_id')
  const canAllocate = isEditable && can(isCreate ? 'purchase.payments.create' : 'purchase.payments.edit')
  const { data: vendorContextData, isFetching: billsLoading, error: billsError, refetch: reloadBills } = useVendorOpenBills(canAllocate ? vendorId : null)
  const openBills = vendorContextData?.data?.open_bills ?? []
  const matchingBills = openBills.filter((bill) => bill.bill_number.toLowerCase().includes(billSearch.toLowerCase()))
  const billPages = Math.max(1, Math.ceil(matchingBills.length / 10))
  const currentBillPage = Math.min(billPage, billPages)
  const cashAccountId = watch('cash_bank_account_id')
  const cashBalance = useVendorPaymentCashBalance(canAllocate ? cashAccountId : undefined)
  const balance = cashBalance.data?.data

  const status = (payment?.status ?? 'draft') as DocumentStatus
  const totalAmount = Number(billLines.reduce((sum, line) => sum + line.amount, 0).toFixed(2))
  const totalDiscount = Number(billLines.reduce((sum, line) => sum + (line.settlement_discount_amount ?? 0), 0).toFixed(2))
  const totalSettled = Number((totalAmount + totalDiscount).toFixed(2))

  useEffect(() => {
    if (payment) {
      reset({ vendor_id: payment.vendor_id, date: payment.date, cash_bank_account_id: payment.cash_bank_account_id, amount: payment.amount, notes: payment.notes ?? '' })
      // Pembayaran posted sudah mengurangi sisa tagihan; saat diedit, jumlah
      // miliknya sendiri dikembalikan supaya batas bayarnya benar.
      setBillLines(
        payment.lines.map((l) => ({
          vendor_bill_id: l.vendor_bill_id,
          bill_number: l.bill_number ?? '',
          balance_due: (l.balance_due ?? 0) + (payment.status === 'posted' ? l.amount + (l.settlement_discount_amount ?? 0) : 0),
          amount: l.amount,
          settlement_discount_amount: l.settlement_discount_amount ?? 0,
          settlement_discount_account_id: l.settlement_discount_account_id,
          settlement_discount_note: l.settlement_discount_note,
          accountOption: l.settlement_discount_account ? {
            value: l.settlement_discount_account.id,
            label: l.settlement_discount_account.account_name,
            sublabel: l.settlement_discount_account.account_code,
          } : undefined,
          grand_total: l.grand_total,
        })),
      )
    }
  }, [payment, reset])

  useEffect(() => {
    setValue('amount', totalAmount)
  }, [totalAmount, setValue])

  const handleAddBill = (billId: number) => {
    const bill = openBills.find((b) => b.vendor_bill_id === billId)
    if (bill && !billLines.find((l) => l.vendor_bill_id === billId)) {
      setBillLines((prev) => [...prev, { vendor_bill_id: bill.vendor_bill_id, bill_number: bill.bill_number, balance_due: bill.balance_due, amount: bill.balance_due, grand_total: bill.grand_total, settlement_discount_amount: 0 }])
    }
  }

  const billColumns: LineItemColumn<BillLine>[] = [
    {
      id: 'bill_number',
      header: 'Nomor Faktur',
      width: 160,
      render: ({ item }) => <span className="text-[12px] font-medium text-[#5c9ead]">{item.bill_number}</span>,
    },
    {
      id: 'grand_total',
      header: 'Jumlah',
      width: 120,
      align: 'right',
      render: ({ item }) => <span className="text-[12px]">{item.grand_total === undefined ? '—' : formatCurrency(item.grand_total)}</span>,
    },
    {
      id: 'amount',
      header: 'Dibayar',
      width: 120,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => isReadOnly ? (
        <span className="text-[12px]">{formatCurrency(item.amount)}</span>
      ) : (
        <AmountInput
          value={item.amount}
          onChange={(amount) => onUpdate('amount', amount)}
          decimals={2}
          ariaLabel={`Dibayar ${item.bill_number}`}
          className={FLUSH_INPUT_CLASS}
        />
      ),
    },
    {
      id: 'settlement_discount',
      header: 'Discount',
      width: 120,
      align: 'right',
      render: ({ item }) => canAllocate || item.settlement_discount_amount ? (
        <SettlementDiscountCell
          documentNumber={item.bill_number}
          amount={item.settlement_discount_amount}
          onOpen={(restoreFocus) => setDiscountSelection({ id: item.vendor_bill_id, restoreFocus })}
        />
      ) : <span className="text-[12px]">{formatCurrency(0)}</span>,
    },
    {
      id: 'balance_due',
      header: 'Sisa Tagihan',
      width: 130,
      align: 'right',
      render: ({ item }) => {
        const remaining = status === 'void'
          ? item.balance_due
          : Math.max(0, Number((item.balance_due - item.amount - (item.settlement_discount_amount ?? 0)).toFixed(2)))

        return <span className="text-[12px]">{formatCurrency(remaining)}</span>
      },
    },
  ]

  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<VendorPaymentFormValues, BillLine[]>({
    draftKey: `purchase.vendor-payment.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: billLines,
    onRestoreExtra: setBillLines,
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<VendorPaymentFormValues>({
    id,
    basePath: '/purchase/payments',
    createLabel: 'Pembayaran Pembelian Baru',
    sequenceQueryKey: ['purchase', 'payments', 'adjacent'],
    fetchAdjacent: async (recordId) => (await vendorPaymentApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values, creating) => {
      const invalid = billLines.find((line) =>
        line.amount <= 0 || Number((line.amount + (line.settlement_discount_amount ?? 0)).toFixed(2)) > Number(line.balance_due.toFixed(2)),
      )
      if (invalid) {
        const message = `Periksa ${invalid.bill_number}. Jumlah kas harus positif dan kas ditambah potongan tidak boleh melebihi sisa tagihan.`
        setError('amount', { type: 'manual', message })
        throw new Error(message)
      }
      const lines: VendorPaymentLinePayload[] = billLines.map(({ vendor_bill_id, amount, settlement_discount_amount, settlement_discount_account_id, settlement_discount_note }) => ({
        vendor_bill_id, amount, ...(settlement_discount_amount ? { settlement_discount_amount, settlement_discount_account_id, settlement_discount_note } : {}),
      }))
      const payload = { ...toVendorPaymentPayload(values), lines }
      if (creating) await create.mutateAsync(payload)
      else await update.mutateAsync({ id: Number(id), payload })
    },
    onSaved: () => {
      formDraft.clearDraft()
      setEditing(false)
    },
    successMessage: (creating) => (creating ? 'Pembayaran pemasok berhasil dibuat.' : 'Pembayaran pemasok berhasil diperbarui.'),
    onError: (saveError) => {
      // Backend memakai nama kolom DB (`payment_date`), form memakai `date`.
      applyApiValidationErrors(saveError, setError, { payment_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan pembayaran pembelian.'))
    },
    canSave: isEditable,
  })

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      toast.success('Pembayaran berhasil diposting.')
    } catch (postError) {
      toast.error(getApiErrorMessage(postError, 'Gagal posting pembayaran.'))
    }
  }
  const handleVoid = async (reason: string) => {
    await voidPayment.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Pembayaran berhasil di-void.')
    setVoidOpen(false)
  }

  const handleDelete = async (reason?: string) => {
    try {
      await remove.mutateAsync({ id: Number(id), reason })
      toast.success('Pembayaran pemasok berhasil dihapus.')
      setDeleteOpen(false)
      closeRecordTab(window.location.pathname, '/purchase/payments')
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'Gagal menghapus pembayaran pembelian.'))
    }
  }

  const actions: DocumentActionButton[] = []
  if (!isCreate && payment && can('purchase.payments.print')) {
    actions.push({ id: 'print', label: 'Cetak', variant: 'neutral', onClick: () => setPrintOpen(true) })
  }
  if (!isCreate && canChange(payment?.status)) {
    if (payment?.status !== 'draft' && !editing && can('purchase.payments.edit')) {
      actions.push({ id: 'edit', label: 'Edit', variant: 'secondary', onClick: () => setEditing(true) })
    }
    if (can('purchase.payments.delete')) actions.push({ id: 'delete', label: 'Hapus', variant: 'destructive', onClick: () => setDeleteOpen(true) })
  }
  if (editing) {
    actions.push({ id: 'cancel_edit', label: 'Batal Edit', variant: 'neutral', onClick: () => setEditing(false) })
  }
  if (isEditable && can(isCreate ? 'purchase.payments.create' : 'purchase.payments.edit')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (payment?.status === 'draft' && can('purchase.payments.approve')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (payment?.status === 'posted' && can('purchase.payments.delete')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Pembayaran Pembelian" breadcrumb={[{ label: 'Pembelian' }, { label: 'Pembayaran Pembelian', path: '/purchase/payments' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Pembayaran Pembelian' : 'Pembayaran Pembelian'}
        documentNumber={payment?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Pembayaran Pembelian', path: '/purchase/payments' }, { label: isCreate ? 'Buat Pembayaran' : (payment?.number ?? '') }]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentHistoryButton documentType="vendor_payment" documentId={id} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={payment?.number} actions={actions} />
          </>
        }
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Pemasok <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                cacheKey="contact"
                triggerAriaLabel="Pemasok yang dibayar"
                value={vendorId ?? null}
                onChange={(v) => {
                  if (v !== vendorId) setBillLines([])
                  setValue('vendor_id', v as number)
                  setBillSearch('')
                  setBillPage(1)
                }}
                onSearch={(q) => kontakApi.search(q, 'supplier')}
                placeholder="Pilih pemasok..."
                disabled={!canAllocate}
                error={errors.vendor_id?.message}
                selectedOptions={payment?.vendor ? [{ value: payment.vendor.id, label: payment.vendor.name }] : []}
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
                cacheKey="coa"
                triggerAriaLabel="Akun kas/bank pembayaran"
                value={cashAccountId ?? null}
                onChange={(v) => setValue('cash_bank_account_id', v as number)}
                onSearch={(q) => coaApi.search(q, { is_cash_bank: true, is_active: true })}
                placeholder="Pilih akun kas/bank..."
                disabled={!canAllocate}
                error={errors.cash_bank_account_id?.message}
                selectedOptions={
                  payment?.cash_bank_account ? [{ value: payment.cash_bank_account.id, label: `${payment.cash_bank_account.code} - ${payment.cash_bank_account.name}` }] : []
                }
              />
              {canAllocate && cashAccountId && (
                <div className="space-y-1 text-[12px] text-[#64748b] print:hidden" data-testid="payment-cash-preview" aria-live="polite">
                  {cashBalance.isFetching ? (
                    <p>Memuat saldo kas/bank...</p>
                  ) : cashBalance.error ? (
                    <p role="alert">
                      {getApiErrorMessage(cashBalance.error, 'Saldo kas/bank belum dapat dimuat.')}{' '}
                      <Button type="button" variant="ghost" size="sm" onClick={() => void cashBalance.refetch()}>
                        Coba lagi
                      </Button>
                    </p>
                  ) : (
                    balance && (
                      <p>
                        Saldo kas/bank saat ini <span className="font-medium tabular-nums">{formatCurrency(balance.balance)}</span>
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total Pembayaran</Label>
              <Input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                disabled
                className={cn('h-9 text-[13px] tabular-nums text-right', fieldErrorClass(errors.amount))}
              />
              <FieldError message={errors.amount?.message} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} />
              <FieldError message={errors.notes?.message} />
            </div>
          </FormSection>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Faktur Pembelian yang Dibayar</p>
            </div>
            {canAllocate && vendorId && (
              <div className="mb-3 space-y-2 rounded border border-[#e2e8f0] p-3 print:hidden">
                <p className="text-[12px] font-semibold">Faktur pembelian yang belum lunas</p>
                {billsLoading ? (
                  <p className="text-[12px]">Memuat faktur pembelian...</p>
                ) : billsError ? (
                  <p role="alert" className="text-[12px]">
                    {getApiErrorMessage(billsError, 'Daftar faktur pembelian belum dapat dimuat.')}{' '}
                    <Button type="button" variant="ghost" size="sm" onClick={() => void reloadBills()}>
                      Coba lagi
                    </Button>
                  </p>
                ) : openBills.length === 0 ? (
                  <p className="text-[12px] text-[#64748b]">Tidak ada faktur pembelian terbuka. Faktur Pembelian yang bisa dibayar harus sudah diposting dan masih memiliki sisa pembayaran.</p>
                ) : (
                  <>
                    <Input
                      aria-label="Cari faktur pembelian"
                      placeholder="Cari nomor faktur..."
                      value={billSearch}
                      onChange={(event) => {
                        setBillSearch(event.target.value)
                        setBillPage(1)
                      }}
                      className="h-8 text-[12px]"
                    />
                    {matchingBills.slice((currentBillPage - 1) * 10, currentBillPage * 10).map((bill) => (
                      <div key={bill.vendor_bill_id} className="flex items-center justify-between gap-2 border-t border-[#e2e8f0] py-2 text-[12px]">
                        <div>
                          <p className="font-medium">{bill.bill_number}</p>
                          <p className="tabular-nums text-[#64748b]">Sisa {formatCurrency(bill.balance_due)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={billLines.some((line) => line.vendor_bill_id === bill.vendor_bill_id)}
                          onClick={() => handleAddBill(bill.vendor_bill_id)}
                          aria-label={`Tambahkan ${bill.bill_number}`}
                        >
                          {billLines.some((line) => line.vendor_bill_id === bill.vendor_bill_id) ? 'Ditambahkan' : 'Tambahkan'}
                        </Button>
                      </div>
                    ))}
                    {matchingBills.length === 0 && <p className="text-[12px]">Nomor faktur tidak ditemukan.</p>}
                    {billPages > 1 && (
                      <div className="flex items-center gap-2 text-[12px]">
                        <Button type="button" variant="outline" size="sm" disabled={currentBillPage <= 1} onClick={() => setBillPage(currentBillPage - 1)}>
                          Sebelumnya
                        </Button>
                        <span>
                          {currentBillPage} / {billPages}
                        </span>
                        <Button type="button" variant="outline" size="sm" disabled={currentBillPage >= billPages} onClick={() => setBillPage(currentBillPage + 1)}>
                          Berikutnya
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <LineItemsTable<BillLine>
              items={billLines}
              columns={billColumns}
              onRemove={(index) => setBillLines((prev) => prev.filter((_, idx) => idx !== index))}
              onUpdate={(index, field, value) => setBillLines((rows) => rows.map((row, i) => i === index ? { ...row, [field]: value } : row))}
              isReadOnly={!isEditable}
              emptyLabel="Belum ada faktur pembelian dipilih"
            />
            <div className="mt-3 flex flex-col items-end gap-1 text-[13px] text-[#24323a]">
              <p>Kas dibayar: <span className="font-semibold tabular-nums">{formatCurrency(totalAmount)}</span></p>
              <p>Potongan: <span className="tabular-nums">{formatCurrency(totalDiscount)}</span></p>
              <p>Total mengurangi tagihan: <span className="font-semibold tabular-nums">{formatCurrency(totalSettled)}</span></p>
              <FieldError message={errors.amount?.message} />
            </div>
          </div>
        </div>
      </FormLayout>
      <DeleteDocumentDialog
        isOpen={isDeleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(reason) => void handleDelete(reason)}
        documentNumber={payment?.number ?? ''}
        hasEffects={payment?.status === 'posted'}
        isLoading={remove.isPending}
      />
      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={payment?.number ?? ''}
        isLoading={voidPayment.isPending}
      />
      {discountSelection && discountLine && (
        <SettlementDiscountDialog
          key={discountLine.vendor_bill_id}
          documentNumber={discountLine.bill_number}
          grandTotal={discountLine.grand_total}
          balanceDue={discountLine.balance_due}
          cashAmount={discountLine.amount}
          value={discountLine}
          readOnly={!canAllocate}
          preferredAccountType="expense"
          onClose={() => setDiscountSelection(undefined)}
          onRestoreFocus={discountSelection.restoreFocus}
          onSave={(discount, amount) => {
            setBillLines((rows) => rows.map((row) => row.vendor_bill_id === discountLine.vendor_bill_id ? { ...row, ...discount, amount } : row))
            setDiscountSelection(undefined)
          }}
        />
      )}
      <DocumentPrintDialog open={printOpen} onClose={() => setPrintOpen(false)} data={payment ? vendorPaymentPrint(payment) : null} defaultPaper="half-a4" />
    </>
  )
}
