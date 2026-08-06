import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
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
import type { RawGoodsReceipt } from '../types/goodsReceipt.types'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

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

  const { data, isLoading } = useGoodsReceipt(id ? Number(id) : undefined)
  const gr = data?.data
  const { create, receive, cancel, void: voidGr } = useGoodsReceiptMutations()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang

  // ditolak ikut ditandai, bukan cuma toast.

  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isVoidOpen, setVoidOpen] = useState(false)

  const status = (gr?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || gr?.status === 'draft'

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

  const { saveAndClose, navProps } = useRecordFormNavigation<GoodsReceiptFormValues, RawGoodsReceipt>({
    id,
    basePath: '/purchase/goods-receipts',
    createLabel: 'Penerimaan Barang Baru',
    getRecordLabel: (record) => record.receipt_number,
    sequenceQueryKey: ['purchase', 'goods-receipts', 'sequence'],
    fetchAll: async () => (await goodsReceiptApi.listAll()).data,
    handleSubmit,
    save: async (values) => {
      await create.mutateAsync(toGoodsReceiptPayload(values, lines.map(toGoodsReceiptLine)))
    },
    onSaved: () => {
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

  const actions: DocumentActionButton[] = []
  if (isEditable && can('purchase.goods-receipts.create')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (gr?.status === 'draft' && can('purchase.goods-receipts.receive')) {
      actions.push({ id: 'receive', label: 'Terima Barang', variant: 'primary', onClick: () => void handleReceive(), isLoading: receive.isPending })
    }
    if (gr?.status === 'draft' && can('purchase.goods-receipts.update')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => void handleCancel(), isLoading: cancel.isPending })
    }
    if (gr?.status === 'received' && can('purchase.goods-receipts.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product', header: 'Produk', width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect
          value={item.product_id}
          onChange={(v) => onUpdate('product_id', v)}
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
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" />
      ),
    },
    {
      id: 'quantity', header: 'Qty', width: 90, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
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
            <DocumentActionBar placement="header" documentStatus={status} documentNumber={gr?.number} actions={actions} />
          </>
        }
      >
        <div className="space-y-3">
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
        </div>
      </FormLayout>

      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={gr?.number ?? ''}
        isLoading={voidGr.isPending}
      />
    </>
  )
}
