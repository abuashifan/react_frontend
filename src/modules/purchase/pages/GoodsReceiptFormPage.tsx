import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { AmountInput } from '@/components/shared/form/AmountInput'
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
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useGoodsReceipt, useGoodsReceiptMutations } from '../hooks/useGoodsReceiptList'
import { toGoodsReceiptPayload } from '../services/goodsReceiptAdapter'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { goodsReceiptSchema, type GoodsReceiptFormValues } from '../schemas/goodsReceiptSchema'
import { goodsReceiptApi } from '../services/goodsReceiptApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { DocumentHistoryButton } from '@/modules/accounting/components/DocumentHistoryButton'
import { DocumentPrintDialog } from '@/components/shared/print/DocumentPrintDialog'
import { goodsReceiptPrint } from '../print/purchasePrint'

interface EditableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  billed_quantity?: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, product: null, description: '', quantity: 1 }

function lineSubtotal() { return 0 }

function toGoodsReceiptLine(line: EditableLine): Omit<EditableLine, 'billed_quantity'> {
  const { billed_quantity, ...editable } = line
  void billed_quantity
  return editable
}

export default function GoodsReceiptFormPage() {
  const { id } = useParams()
  // `/purchase/goods-receipts/create` dan `/purchase/goods-receipts/:id` merender komponen
  // yang sama, dan React Router tidak me-remount otomatis saat berpindah di antara keduanya
  // (hanya param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <GoodsReceiptFormPageContent key={id ?? 'create'} />
}

function GoodsReceiptFormPageContent() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [printOpen, setPrintOpen] = useState(false)

  const { data, isLoading } = useGoodsReceipt(id ? Number(id) : undefined)
  const gr = data?.data
  const { create, createFromPurchaseOrder, receive, cancel, void: voidGr, remove, update } = useGoodsReceiptMutations()
  // GR manual tidak membawa harga, jadi nilai persediaannya hanya benar bila
  // diterima dari PO. Pilihan sumber ini hanya muncul saat membuat GR baru.
  const [sourceMode, setSourceMode] = useState<'none' | 'purchase_order'>('none')
  const [sourcePoId, setSourcePoId] = useState<number | null>(null)
  const isSourceMode = isCreate && sourceMode === 'purchase_order'
  const handleCreateFromPo = async () => {
    if (!sourcePoId) return
    try {
      const res = await createFromPurchaseOrder.mutateAsync(sourcePoId)
      toast.success('Penerimaan barang dibuat dari PO.')
      replaceRecordTab('/purchase/goods-receipts/create', { label: res.data.number ?? 'Penerimaan Barang', path: `/purchase/goods-receipts/${res.data.id}` })
    } catch (convertError) { toast.error(getApiErrorMessage(convertError, 'Gagal membuat penerimaan barang dari PO.')) }
  }
  const { canChange } = useTransactionEditMode()
  const { closeRecordTab, replaceRecordTab } = useRecordTab()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang

  // ditolak ikut ditandai, bukan cuma toast.

  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // Mode open: dokumen yang sudah berefek dibuka untuk diedit lewat tombol Edit.
  const [editing, setEditing] = useState(false)

  const status = (gr?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || gr?.status === 'draft' || editing

  useEffect(() => {
    if (gr) {
      reset({ vendor_id: gr.vendor_id, date: gr.date, warehouse_id: gr.warehouse_id, notes: gr.notes ?? '' })
      setLines(gr.lines.map((l) => ({
        product_id: l.product_id,
        product: l.product ?? null,
        description: l.description,
        quantity: l.quantity,
        billed_quantity: l.billed_quantity,
      })))
    }
  }, [gr, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<GoodsReceiptFormValues, EditableLine[]>({
    draftKey: `purchase.goods-receipt.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [DEFAULT_LINE]),
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<GoodsReceiptFormValues>({
    id,
    basePath: '/purchase/goods-receipts',
    createLabel: 'Penerimaan Barang Baru',
    sequenceQueryKey: ['purchase', 'goods-receipts', 'adjacent'],
    fetchAdjacent: async (recordId) => (await goodsReceiptApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values, creating) => {
      const payload = toGoodsReceiptPayload(values, lines.map(toGoodsReceiptLine))
      if (creating) await create.mutateAsync(payload)
      else await update.mutateAsync({ id: Number(id), payload })
    },
    onSaved: () => {
      setEditing(false)
      formDraft.clearDraft()
      setLineErrors({})
    },
    successMessage: () => 'Penerimaan barang berhasil dibuat.',
    onError: (saveError) => {
      // Backend memakai nama kolom DB (`receipt_date`), form memakai `date`.
      setLineErrors(getApiLineErrors(saveError))
      applyApiValidationErrors(saveError, setError, { receipt_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan penerimaan barang.'))
    },
    canSave: isEditable,
  })

  const handleReceive = async () => {
    try { await receive.mutateAsync(Number(id)); toast.success('Barang berhasil diterima.') }
    catch (receiveError) { toast.error(getApiErrorMessage(receiveError, 'Gagal menerima barang.')) }
  }
  const handleCancel = async () => {
    try { await cancel.mutateAsync(Number(id)); toast.success('GR dibatalkan.') }
    catch (cancelError) { toast.error(getApiErrorMessage(cancelError, 'Gagal membatalkan GR.')) }
  }
  const handleVoid = async (reason: string) => {
    await voidGr.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('GR berhasil di-void.')
    setVoidOpen(false)
  }

  const handleDelete = async (reason?: string) => {
    try {
      await remove.mutateAsync({ id: Number(id), reason })
      toast.success('Penerimaan barang berhasil dihapus.')
      setDeleteOpen(false)
      closeRecordTab(window.location.pathname, '/purchase/goods-receipts')
    } catch (deleteError) { toast.error(getApiErrorMessage(deleteError, 'Gagal menghapus penerimaan barang.')) }
  }

  const actions: DocumentActionButton[] = []
  if (!isCreate && gr && can('purchase.goods_receipts.print')) {
    actions.push({ id: 'print', label: 'Cetak', variant: 'neutral', onClick: () => setPrintOpen(true) })
  }
  if (!isCreate && canChange(gr?.status)) {
    if (gr?.status !== 'draft' && !editing && can('purchase.goods_receipts.edit')) {
      actions.push({ id: 'edit', label: 'Edit', variant: 'secondary', onClick: () => setEditing(true) })
    }
    if (can('purchase.goods_receipts.delete')) actions.push({ id: 'delete', label: 'Hapus', variant: 'destructive', onClick: () => setDeleteOpen(true) })
  }
  if (editing) {
    actions.push({ id: 'cancel_edit', label: 'Batal Edit', variant: 'neutral', onClick: () => setEditing(false) })
  }
  if (isEditable && can(isCreate ? 'purchase.goods_receipts.create' : 'purchase.goods_receipts.edit')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (gr?.status === 'draft' && can('purchase.goods_receipts.approve')) {
      actions.push({ id: 'receive', label: 'Terima Barang', variant: 'primary', onClick: () => void handleReceive(), isLoading: receive.isPending })
    }
    if (gr?.status === 'draft' && can('purchase.goods_receipts.edit')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => void handleCancel(), isLoading: cancel.isPending })
    }
    if (gr?.status === 'received' && can('purchase.goods_receipts.delete')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product', header: 'Produk', width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect
          flush
          value={item.product_id}
          onChange={(v, opt) => { onUpdate('product_id', v); onUpdate('product', opt ? { id: opt.value, code: opt.sublabel ?? '', name: opt.label } : null); if (opt && !item.description?.trim()) onUpdate('description', opt.label) }}
          onSearch={produkApi.search}
          placeholder="Pilih produk..."
          disabled={isReadOnly}
          size="sm"
          selectedOptions={item.product ? [{ value: item.product.id, label: item.product.name, sublabel: item.product.code }] : []}
        />
      ),
    },
    {
      id: 'description', header: 'Deskripsi', width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className={cn('h-8 text-[12px]', FLUSH_INPUT_CLASS)} />
      ),
    },
    {
      id: 'quantity', header: 'Qty', width: 90, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput value={item.quantity} onChange={(v) => onUpdate('quantity', v)} disabled={isReadOnly} decimals={2} ariaLabel="quantity" className={cn(FLUSH_INPUT_CLASS, 'text-right')} />
      ),
    },
    ...(!isCreate && gr ? [{
      id: 'billed', header: 'Ditagih', width: 90, align: 'right' as const,
      render: ({ item }: { item: EditableLine }) => <span className="text-[12px] tabular-nums text-[#64748b]">{item.billed_quantity ?? 0}</span>,
    }] : []),
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Penerimaan Barang" breadcrumb={[{ label: 'Pembelian' }, { label: 'Penerimaan Barang', path: '/purchase/goods-receipts' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Penerimaan Barang' : 'Penerimaan Barang'}
        documentNumber={gr?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Penerimaan Barang', path: '/purchase/goods-receipts' }, { label: isCreate ? 'Buat GR' : (gr?.number ?? '') }]}
        headerActions={
          <>
            <RecordNavButtons {...navProps} isBusy={isSubmitting} />
            <DocumentHistoryButton documentType="goods_receipt" documentId={id} />
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={gr?.number} actions={actions} />
          </>
        }
      >
        <div className="space-y-3">
          {isCreate && (
            <FormSection title="Sumber Dokumen">
              <div className="flex flex-col gap-2 md:col-span-2">
                <div className="flex gap-1">
                  {([['none', 'Tanpa Sumber'], ['purchase_order', 'Dari Purchase Order']] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setSourceMode(mode); setSourcePoId(null) }}
                      className={`h-8 rounded px-3 text-[12px] font-medium transition-colors ${sourceMode === mode ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {isSourceMode ? (
                  <>
                    <SearchableSelect value={sourcePoId} onChange={(v) => setSourcePoId(v)} onSearch={goodsReceiptApi.searchReceivableOrders} placeholder="Pilih purchase order..." />
                    <p className="text-[11px] text-[#94a3b8]">Item, sisa qty, harga, dan gudang diambil dari PO. Periksa lalu klik Terima Barang.</p>
                    <div>
                      <Button type="button" className="h-8 bg-[#5c9ead] px-3 text-[13px] hover:bg-[#4a8593]" disabled={!sourcePoId || createFromPurchaseOrder.isPending} onClick={() => void handleCreateFromPo()}>
                        {createFromPurchaseOrder.isPending ? 'Memproses...' : 'Buat dari PO'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-[#94a3b8]">Penerimaan tanpa PO dinilai dengan harga rata-rata persediaan saat ini.</p>
                )}
              </div>
            </FormSection>
          )}
          {!isSourceMode && (
          <>
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect
                value={watch('vendor_id') ?? null}
                onChange={(v) => setValue('vendor_id', v as number)}
                onSearch={(q) => kontakApi.search(q, 'supplier')}
                placeholder="Pilih vendor..."
                disabled={!isEditable}
                error={errors.vendor_id?.message}
                selectedOptions={gr?.vendor ? [{ value: gr.vendor.id, label: gr.vendor.name }] : []}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
              <FieldError message={errors.date?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang Tujuan</Label>
              <SearchableSelect
                value={watch('warehouse_id') ?? null}
                onChange={(v) => setValue('warehouse_id', v)}
                onSearch={gudangApi.search}
                placeholder="Pilih gudang..."
                disabled={!isEditable}
                error={errors.warehouse_id?.message}
                selectedOptions={gr?.warehouse ? [{ value: gr.warehouse.id, label: gr.warehouse.name }] : []}
              />
            </div>

            {gr?.purchase_order_number && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari PO</Label>
                <p className="text-[13px] font-medium text-[#5c9ead]">{gr.purchase_order_number}</p>
              </div>
            )}

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} />
              <FieldError message={errors.notes?.message} />
            </div>
          </FormSection>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item</p>
            <LineItemsTable
          errors={lineErrors}
              items={lines}
              columns={columns}
              onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
              onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))}
              getSubtotal={lineSubtotal}
              isReadOnly={!isEditable}
              addLabel="Tambah Item"
            />
          </div>
          </>
          )}
        </div>
      </FormLayout>

      <DeleteDocumentDialog isOpen={isDeleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={(reason) => void handleDelete(reason)} documentNumber={gr?.number ?? ''} hasEffects={!['draft', 'cancelled'].includes(gr?.status ?? 'draft')} isLoading={remove.isPending} />
      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={gr?.number ?? ''}
        isLoading={voidGr.isPending}
      />
      <DocumentPrintDialog open={printOpen} onClose={() => setPrintOpen(false)} data={gr ? goodsReceiptPrint(gr) : null} />
    </>
  )
}
