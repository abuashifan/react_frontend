import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useGoodsReceipt, useGoodsReceiptMutations } from '../hooks/useGoodsReceiptList'
import { validatePurchaseLines } from '../services/purchaseFormValidation'
import { SourceDocumentPicker } from '../components/SourceDocumentPicker'
import type { PurchaseSourceDocumentItem } from '../services/sourceDocumentApi'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { goodsReceiptSchema, type GoodsReceiptFormValues } from '../schemas/goodsReceiptSchema'
import type { DocumentStatus } from '@/types/common.types'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  billed_quantity?: number
  source_quantity?: number
  purchase_order_line_id?: number | null
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1 }

function lineSubtotal() { return 0 }

function numberValue(value: unknown): number {
  return Number(value ?? 0)
}

function toGoodsReceiptLine(line: EditableLine) {
  const { billed_quantity, source_quantity, ...editable } = line
  void billed_quantity
  void source_quantity
  return editable
}

export default function GoodsReceiptFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useGoodsReceipt(id ? Number(id) : undefined)
  const gr = data?.data
  const { create, receive, cancel, void: voidGr } = useGoodsReceiptMutations()

  const { control, getValues, register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [lineErrors, setLineErrors] = useState<string[]>([])
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isSourcePickerOpen, setSourcePickerOpen] = useState(false)
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [sourceNumber, setSourceNumber] = useState('')

  const status = (gr?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || gr?.status === 'draft'

  const formDraft = usePersistentFormDraft<GoodsReceiptFormValues, {
    lines: EditableLine[]
    sourceId: number | null
    sourceNumber: string
  }>({
    draftKey: `purchase.goods-receipt.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: { lines, sourceId, sourceNumber },
    onRestoreExtra: (extra) => {
      setLines(extra.lines?.length ? extra.lines : [{ ...DEFAULT_LINE }])
      setSourceId(extra.sourceId ?? null)
      setSourceNumber(extra.sourceNumber ?? '')
    },
    enabled: isEditable,
  })

  useEffect(() => {
    if (gr) {
      reset({ vendor_id: gr.vendor_id, date: gr.date, warehouse_id: gr.warehouse_id, notes: gr.notes ?? '' })
      setLines(gr.lines.map((l) => ({ product_id: l.product_id, description: l.description, quantity: l.quantity, billed_quantity: l.billed_quantity, purchase_order_line_id: l.purchase_order_line_id })))
      setSourceId(gr.purchase_order_id ?? null)
      setSourceNumber(gr.purchase_order_number ?? '')
    }
  }, [gr, reset])

  const handleSourceSelect = (document: PurchaseSourceDocumentItem) => {
    setSourceId(document.source_id)
    setSourceNumber(document.number)
    setValue('vendor_id', document.partner_id ?? numberValue(document.header.vendor_id))
    setLines(document.lines.map((line) => ({
      product_id: line.product_id == null ? null : numberValue(line.product_id),
      description: String(line.description ?? ''),
      quantity: numberValue(line.remaining_quantity),
      source_quantity: numberValue(line.remaining_quantity),
      purchase_order_line_id: numberValue(line.purchase_order_line_id ?? line.id),
    })))
    setLineErrors([])
    setSourcePickerOpen(false)
  }

  const handleSave = handleSubmit(async (values) => {
    const nextLineErrors = validatePurchaseLines(lines)
    lines.forEach((line, index) => {
      if (line.source_quantity !== undefined && line.quantity > line.source_quantity) {
        nextLineErrors.push(`Baris ${index + 1}: kuantitas melebihi sisa PO.`)
      }
    })
    setLineErrors(nextLineErrors)
    if (nextLineErrors.length > 0) return
    try {
      const res = await create.mutateAsync({ ...values, purchase_order_id: sourceId, lines: lines.map(toGoodsReceiptLine) })
      formDraft.clearDraft()
      toast.success('Penerimaan barang berhasil dibuat.')
      navigate(`/purchase/goods-receipts/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan penerimaan barang.') }
  })

  const handleReceive = async () => {
    try { await receive.mutateAsync(Number(id)); toast.success('Barang berhasil diterima.') }
    catch { toast.error('Gagal menerima barang.') }
  }
  const handleCancel = async () => {
    try { await cancel.mutateAsync(Number(id)); toast.success('GR dibatalkan.') }
    catch { toast.error('Gagal membatalkan GR.') }
  }
  const handleVoid = async (reason: string) => {
    await voidGr.mutateAsync({ id: Number(id), reason })
    toast.success('GR berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('purchase.goods-receipts.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
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
        <SearchableSelect value={item.product_id} onChange={(v) => onUpdate('product_id', v)} onSearch={produkApi.search} placeholder="Pilih produk..." disabled={isReadOnly} size="sm" />
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
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={gr?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            {isCreate && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Purchase Order</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => setSourcePickerOpen(true)}>Pilih PO</Button>
                  {sourceNumber && <span className="text-[13px] font-medium text-[#5c9ead]">{sourceNumber}</span>}
                </div>
              </div>
            )}
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
              <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang Tujuan</Label>
              <SearchableSelect
                value={watch('warehouse_id') ?? null}
                onChange={(v) => setValue('warehouse_id', v)}
                onSearch={gudangApi.search}
                placeholder="Pilih gudang..."
                disabled={!isEditable}
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
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item</p>
            <LineItemsTable
              items={lines}
              columns={columns}
              onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
              onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) => { setLineErrors([]); setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l)) }}
              getSubtotal={lineSubtotal}
              isReadOnly={!isEditable}
              addLabel="Tambah Item"
            />
            {lineErrors.length > 0 && (
              <div role="alert" className="mt-2 space-y-1 text-[11px] text-red-600">
                {lineErrors.map((message) => <p key={message}>{message}</p>)}
              </div>
            )}
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
      <SourceDocumentPicker
        isOpen={isCreate && isSourcePickerOpen}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={handleSourceSelect}
        targetType="purchase.goods-receipts"
        sourceType="purchase_order"
        vendorId={watch('vendor_id')}
        title="Pilih Purchase Order"
      />
    </>
  )
}
