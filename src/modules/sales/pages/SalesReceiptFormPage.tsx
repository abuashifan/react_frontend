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
import { SettlementDiscountCell, SettlementDiscountDialog, type SettlementDiscount, type SettlementDiscountSelection } from '@/components/shared/form/SettlementDiscountDialog'
import { FieldError } from '@/components/shared/form/FieldError'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { AmountInput } from '@/components/shared/form/AmountInput'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { useSalesReceipt, useSalesReceiptMutations, useCustomerOpenInvoices } from '../hooks/useSalesReceiptList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { salesReceiptSchema, type SalesReceiptFormValues } from '../schemas/salesReceiptSchema'
import { salesReceiptApi } from '../services/salesReceiptApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { DeleteDocumentDialog } from '@/components/shared/document/DeleteDocumentDialog'
import { useTransactionEditMode } from '@/modules/settings/hooks/useTransactionEditMode'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import { cn, fieldErrorClass, formatCurrency, toDateInputValue } from '@/lib/utils'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { DocumentHistoryButton } from '@/modules/accounting/components/DocumentHistoryButton'
import { DocumentPrintDialog } from '@/components/shared/print/DocumentPrintDialog'
import { salesReceiptPrint } from '../print/salesPrint'

interface ReceiptLine extends SettlementDiscount {
  sales_invoice_id: number
  invoice_number: string
  balance_due: number
  amount: number
  grand_total?: number
}

export default function SalesReceiptFormPage() {
  const { id } = useParams()
  // `/sales/receipts/create` dan `/sales/receipts/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <SalesReceiptFormPageContent key={id ?? 'create'} />
}

function SalesReceiptFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [printOpen, setPrintOpen] = useState(false)

  const { data, isLoading } = useSalesReceipt(id ? Number(id) : undefined)
  const receipt = data?.data
  const { create, update, post, void: voidRec, remove } = useSalesReceiptMutations()
  const { canChange } = useTransactionEditMode()
  const { closeRecordTab } = useRecordTab()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<SalesReceiptFormValues>({
    resolver: zodResolver(salesReceiptSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<ReceiptLine[]>([])
  const [discountSelection, setDiscountSelection] = useState<SettlementDiscountSelection>()
  const discountLine = lines.find((line) => line.sales_invoice_id === discountSelection?.id)
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // Draft selalu bisa diedit; yang sudah posted (mode open) dibuka lewat tombol Edit.
  const [editing, setEditing] = useState(false)

  const status = (receipt?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || receipt?.status === 'draft' || editing
  const canAllocate = isEditable && can(isCreate ? 'sales.receipts.create' : 'sales.receipts.edit')

  const customerId = watch('customer_id')
  const { data: openInvoicesData } = useCustomerOpenInvoices(customerId && isEditable ? customerId : undefined)
  const totalAmount = Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2))
  const totalDiscount = Number(lines.reduce((sum, line) => sum + (line.settlement_discount_amount ?? 0), 0).toFixed(2))
  const totalSettled = Number((totalAmount + totalDiscount).toFixed(2))

  useEffect(() => {
    if (receipt) {
      reset({
        customer_id: receipt.customer_id,
        date: toDateInputValue(receipt.receipt_date ?? receipt.date),
        cash_bank_account_id: receipt.cash_bank_account_id,
        amount: receipt.amount,
        notes: receipt.notes ?? '',
      })
      setLines(receipt.lines.map((l) => ({
        sales_invoice_id: l.sales_invoice_id,
        invoice_number: l.invoice?.number ?? String(l.sales_invoice_id),
        // Penerimaan posted sudah mengurangi sisa tagihan; saat diedit, jumlah
        // miliknya sendiri dikembalikan supaya batas bayarnya benar.
        balance_due: (l.invoice?.balance_due ?? 0) + (receipt.status === 'posted' ? l.amount + (l.settlement_discount_amount ?? 0) : 0),
        amount: l.amount,
        settlement_discount_amount: l.settlement_discount_amount ?? 0,
        settlement_discount_account_id: l.settlement_discount_account_id,
        settlement_discount_note: l.settlement_discount_note,
        accountOption: l.settlement_discount_account ? {
          value: l.settlement_discount_account.id,
          label: l.settlement_discount_account.account_name,
          sublabel: l.settlement_discount_account.account_code,
        } : undefined,
        grand_total: l.invoice?.grand_total,
      })))
    }
  }, [receipt, reset])

  useEffect(() => {
    setValue('amount', totalAmount)
  }, [totalAmount, setValue])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<SalesReceiptFormValues, ReceiptLine[]>({
    draftKey: `sales.receipt.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    // Baris penerimaan diturunkan dari invoice terpilih dan default-nya kosong,
    // jadi draft cukup dipulihkan apa adanya.
    onRestoreExtra: setLines,
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<SalesReceiptFormValues>({
    id,
    basePath: '/sales/receipts',
    createLabel: 'Penerimaan Baru',
    sequenceQueryKey: ['sales', 'receipts', 'adjacent'],
    fetchAdjacent: async (recordId) => (await salesReceiptApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values, creating) => {
      const invalid = lines.find((line) =>
        line.amount <= 0 || Number((line.amount + (line.settlement_discount_amount ?? 0)).toFixed(2)) > Number(line.balance_due.toFixed(2)),
      )
      if (invalid) {
        const message = `Periksa ${invalid.invoice_number}. Jumlah kas harus positif dan kas ditambah potongan tidak boleh melebihi sisa tagihan.`
        setError('amount', { type: 'manual', message })
        throw new Error(message)
      }
      const payload = {
        ...values,
        lines: lines.map(({ sales_invoice_id, amount, settlement_discount_amount, settlement_discount_account_id, settlement_discount_note }) => ({
          sales_invoice_id, amount, ...(settlement_discount_amount ? { settlement_discount_amount, settlement_discount_account_id, settlement_discount_note } : {}),
        })),
      }
      if (creating) await create.mutateAsync(payload)
      else await update.mutateAsync({ id: Number(id), payload })
    },
    onSaved: () => {
      formDraft.clearDraft()
      setEditing(false)
    },
    successMessage: (creating) => (creating ? 'Penerimaan berhasil disimpan.' : 'Penerimaan berhasil diperbarui.'),
    onError: (saveError) => {
      // Backend memvalidasi tanggal sebagai `receipt_date`, form memakai `date`.
      applyApiValidationErrors(saveError, setError, { receipt_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan penerimaan.'))
    },
    canSave: isEditable,
  })

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Penerimaan berhasil diposting.')
    } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal memposting penerimaan.')) }
  }

  const handleVoid = async (reason: string) => {
    await voidRec.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Penerimaan berhasil di-void.')
    setVoidOpen(false)
  }

  const handleDelete = async (reason?: string) => {
    try {
      await remove.mutateAsync({ id: Number(id), reason })
      toast.success('Penerimaan berhasil dihapus.')
      setDeleteOpen(false)
      closeRecordTab(window.location.pathname, '/sales/receipts')
    } catch (deleteError) { toast.error(getApiErrorMessage(deleteError, 'Gagal menghapus penerimaan.')) }
  }

  const actions: DocumentActionButton[] = []
  if (!isCreate && receipt && can('sales.receipts.print')) {
    actions.push({ id: 'print', label: 'Cetak', variant: 'neutral', onClick: () => setPrintOpen(true) })
  }
  if (!isCreate && canChange(receipt?.status)) {
    if (receipt?.status !== 'draft' && !editing && can('sales.receipts.edit')) {
      actions.push({ id: 'edit', label: 'Edit', variant: 'secondary', onClick: () => setEditing(true) })
    }
    if (can('sales.receipts.delete')) actions.push({ id: 'delete', label: 'Hapus', variant: 'destructive', onClick: () => setDeleteOpen(true) })
  }
  if (editing) {
    actions.push({ id: 'cancel_edit', label: 'Batal Edit', variant: 'neutral', onClick: () => setEditing(false) })
  }
  if (isEditable && can(isCreate ? 'sales.receipts.create' : 'sales.receipts.edit')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (receipt?.status === 'draft' && can('sales.receipts.approve')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (receipt?.status === 'posted' && can('sales.receipts.delete')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const openInvoices = openInvoicesData?.data?.open_invoices ?? []

  const addInvoiceLine = (invoiceId: number) => {
    const inv = openInvoices.find((i) => i.id === invoiceId)
    if (!inv || lines.find((l) => l.sales_invoice_id === invoiceId)) return
    setLines((prev) => [...prev, {
      sales_invoice_id: inv.id,
      invoice_number: inv.number,
      balance_due: inv.balance_due,
      amount: inv.balance_due,
      grand_total: inv.grand_total === undefined ? undefined : Number(inv.grand_total),
      settlement_discount_amount: 0,
    }])
  }

  const lineColumns: LineItemColumn<ReceiptLine>[] = [
    {
      id: 'invoice_number',
      header: 'Nomor Faktur',
      width: 160,
      render: ({ item }) => <span className="text-[12px] font-medium text-[#5c9ead]">{item.invoice_number}</span>,
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
      header: 'Diterima',
      width: 120,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => isReadOnly ? (
        <span className="text-[12px]">{formatCurrency(item.amount)}</span>
      ) : (
        <AmountInput
          value={item.amount}
          onChange={(amount) => onUpdate('amount', amount)}
          decimals={2}
          ariaLabel={`Diterima ${item.invoice_number}`}
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
          documentNumber={item.invoice_number}
          amount={item.settlement_discount_amount}
          onOpen={(restoreFocus) => setDiscountSelection({ id: item.sales_invoice_id, restoreFocus })}
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

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Penerimaan" breadcrumb={[{ label: 'Sales' }, { label: 'Penerimaan', path: '/sales/receipts' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Penerimaan' : 'Penerimaan Penjualan'}
        documentNumber={receipt?.number}
        status={status}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Penerimaan', path: '/sales/receipts' },
          { label: isCreate ? 'Buat Penerimaan' : (receipt?.number ?? '') },
        ]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentHistoryButton documentType="sales_receipt" documentId={id} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={receipt?.number} actions={actions} />
          </>
        }
      >
        <div className="space-y-3">
          <FormSection title="Informasi Penerimaan">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Customer <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect cacheKey="contact"
                value={watch('customer_id') ?? null}
                onChange={(v) => { setValue('customer_id', v as number); setLines([]) }}
                onSearch={(q) => kontakApi.search(q, 'customer')}
                placeholder="Pilih customer..."
                disabled={!isEditable}
                error={errors.customer_id?.message}
                selectedOptions={receipt?.customer ? [{ value: receipt.customer.id, label: receipt.customer.name }] : []}
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
              <SearchableSelect cacheKey="coa"
                value={watch('cash_bank_account_id') ?? null}
                onChange={(v) => setValue('cash_bank_account_id', v as number)}
                onSearch={coaApi.search}
                placeholder="Pilih akun..."
                disabled={!isEditable}
                error={errors.cash_bank_account_id?.message}
                selectedOptions={receipt?.cash_bank_account ? [{ value: receipt.cash_bank_account.id, label: receipt.cash_bank_account.name, sublabel: receipt.cash_bank_account.code }] : []}
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} />
              <FieldError message={errors.notes?.message} />
            </div>
          </FormSection>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Invoice yang Dibayar</p>
            </div>

            {/* Baris ditambahkan dari chip "Invoice terbuka" di bawah tabel (barisnya
                datang sudah terisi), jadi tombol "+ Tambah Item" bawaan tidak dipakai. */}
            <LineItemsTable<ReceiptLine>
              items={lines}
              columns={lineColumns}
              onRemove={(index) => setLines((prev) => prev.filter((_, idx) => idx !== index))}
              onUpdate={(index, field, value) => setLines((rows) => rows.map((row, i) => i === index ? { ...row, [field]: value } : row))}
              isReadOnly={!isEditable}
              emptyLabel={customerId ? 'Pilih invoice untuk dibayar' : 'Pilih customer terlebih dahulu'}
            />

            {isEditable && openInvoices.length > 0 && (
              <div className="mt-2 rounded-lg border border-[#d9e2e5] bg-white p-2">
                <p className="mb-1.5 text-[11px] text-[#64748b]">Invoice terbuka:</p>
                <div className="flex flex-wrap gap-1.5">
                  {openInvoices
                    .filter((inv) => !lines.find((l) => l.sales_invoice_id === inv.id))
                    .map((inv) => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => addInvoiceLine(inv.id)}
                        className="rounded border border-[#d9e2e5] px-2 py-1 text-[11px] text-[#326273] hover:border-[#5c9ead] hover:bg-[#f8fbfc]"
                      >
                        {inv.number} ({formatCurrency(inv.balance_due)})
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* `amount` tidak punya input sendiri — nilainya dihitung dari baris invoice,
                jadi error-nya ditandai di baris total ini supaya tetap terlihat. */}
            <div className="mt-3 flex flex-col items-end gap-1 text-[13px] text-[#24323a]">
              <p>Kas diterima: <span className="font-semibold tabular-nums">{formatCurrency(totalAmount)}</span></p>
              <p>Potongan: <span className="tabular-nums">{formatCurrency(totalDiscount)}</span></p>
              <p>Total mengurangi tagihan: <span className="font-semibold tabular-nums">{formatCurrency(totalSettled)}</span></p>
              <FieldError message={errors.amount?.message} />
            </div>
          </div>
        </div>
      </FormLayout>

      <DeleteDocumentDialog isOpen={isDeleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={(reason) => void handleDelete(reason)} documentNumber={receipt?.number ?? ''} hasEffects={receipt?.status === 'posted'} isLoading={remove.isPending} />
      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={receipt?.number ?? ''}
        isLoading={voidRec.isPending}
      />
      {discountSelection && discountLine && (
        <SettlementDiscountDialog
          key={discountLine.sales_invoice_id}
          documentNumber={discountLine.invoice_number}
          grandTotal={discountLine.grand_total}
          balanceDue={discountLine.balance_due}
          cashAmount={discountLine.amount}
          value={discountLine}
          readOnly={!canAllocate}
          preferredAccountType="revenue"
          onClose={() => setDiscountSelection(undefined)}
          onRestoreFocus={discountSelection.restoreFocus}
          onSave={(discount, amount) => {
            setLines((rows) => rows.map((row) => row.sales_invoice_id === discountLine.sales_invoice_id ? { ...row, ...discount, amount } : row))
            setDiscountSelection(undefined)
          }}
        />
      )}
      <DocumentPrintDialog open={printOpen} onClose={() => setPrintOpen(false)} data={receipt ? salesReceiptPrint(receipt) : null} defaultPaper="half-a4" />
    </>
  )
}
