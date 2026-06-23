import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSummary } from '@/components/shared/form/FormSummary'
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
import { usePurchaseReturn, usePurchaseReturnMutations } from '../hooks/usePurchaseReturnList'
import { validatePurchaseLines } from '../services/purchaseFormValidation'
import { SourceDocumentPicker } from '../components/SourceDocumentPicker'
import type { PurchaseSourceDocumentItem, PurchaseSourceDocumentType } from '../services/sourceDocumentApi'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { purchaseReturnSchema, type PurchaseReturnFormValues } from '../schemas/purchaseReturnSchema'
import type { DocumentStatus } from '@/types/common.types'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  source_quantity: number
  vendor_bill_line_id?: number | null
  goods_receipt_line_id?: number | null
}

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price
}

function numberValue(value: unknown): number {
  return Number(value ?? 0)
}

export default function PurchaseReturnFormPage() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [isVoidOpen, setVoidOpen] = useState(false)

  const { data, isLoading } = usePurchaseReturn(id ? Number(id) : undefined)
  const ret = data?.data
  const { create, approve, post, void: voidRet } = usePurchaseReturnMutations()

  const { control, getValues, register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<PurchaseReturnFormValues>({
    resolver: zodResolver(purchaseReturnSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([])
  const [lineErrors, setLineErrors] = useState<string[]>([])
  const [sourcePickerType, setSourcePickerType] = useState<PurchaseSourceDocumentType | null>(null)
  const [isSourcePickerOpen, setSourcePickerOpen] = useState(false)
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [sourceNumber, setSourceNumber] = useState('')

  const status = (ret?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || ret?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  const formDraft = usePersistentFormDraft<PurchaseReturnFormValues, {
    lines: EditableLine[]
    sourceId: number | null
    sourceNumber: string
    sourceType: PurchaseSourceDocumentType | null
  }>({
    draftKey: `purchase.return.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: { lines, sourceId, sourceNumber, sourceType: sourcePickerType },
    onRestoreExtra: (extra) => {
      setLines(extra.lines ?? [])
      setSourceId(extra.sourceId ?? null)
      setSourceNumber(extra.sourceNumber ?? '')
      setSourcePickerType(extra.sourceType ?? null)
    },
    enabled: isCreate,
  })

  useEffect(() => {
    if (ret) {
      reset({ vendor_id: ret.vendor_id, date: ret.date, notes: ret.notes ?? '' })
      setLines(ret.lines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        source_quantity: l.quantity,
        vendor_bill_line_id: l.vendor_bill_line_id,
        goods_receipt_line_id: l.goods_receipt_line_id,
      })))
      setSourceId(ret.vendor_bill_id ?? ret.goods_receipt_id ?? null)
      setSourceNumber(ret.vendor_bill_number ?? ret.goods_receipt_number ?? '')
      setSourcePickerType(ret.vendor_bill_id ? 'vendor_bill' : 'goods_receipt')
    }
  }, [ret, reset])

  const handleSourceSelect = (document: PurchaseSourceDocumentItem) => {
    const sourceType = document.source_type
    setSourcePickerType(sourceType)
    setSourceId(document.source_id)
    setSourceNumber(document.number)
    setValue('vendor_id', document.partner_id ?? numberValue(document.header.vendor_id))
    setLines(document.lines.map((line) => ({
      product_id: line.product_id == null ? null : numberValue(line.product_id),
      description: String(line.description ?? ''),
      quantity: numberValue(line.remaining_quantity),
      source_quantity: numberValue(line.remaining_quantity),
      unit_price: numberValue(line.unit_price),
      vendor_bill_line_id: sourceType === 'vendor_bill' ? numberValue(line.vendor_bill_line_id ?? line.id) : null,
      goods_receipt_line_id: sourceType === 'goods_receipt' ? numberValue(line.goods_receipt_line_id ?? line.id) : null,
    })))
    setLineErrors([])
    setSourcePickerOpen(false)
  }

  const handleSave = handleSubmit(async (values) => {
    const validationErrors = validatePurchaseLines(lines)
    lines.forEach((line, index) => {
      if (line.quantity > line.source_quantity) {
        validationErrors.push(`Baris ${index + 1}: kuantitas retur melebihi sisa dokumen sumber.`)
      }
    })
    if (!sourceId || !sourcePickerType) validationErrors.unshift('Dokumen sumber wajib dipilih.')
    setLineErrors(validationErrors)
    if (validationErrors.length > 0) return

    const payload = {
      ...values,
      vendor_bill_id: sourcePickerType === 'vendor_bill' ? sourceId : null,
      goods_receipt_id: sourcePickerType === 'goods_receipt' ? sourceId : null,
      lines: lines.map((line) => ({
        product_id: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        vendor_bill_line_id: line.vendor_bill_line_id,
        goods_receipt_line_id: line.goods_receipt_line_id,
      })),
    }
    try {
      await create.mutateAsync(payload)
      formDraft.clearDraft()
      toast.success('Retur pembelian berhasil dibuat.')
    } catch { toast.error('Gagal menyimpan retur pembelian.') }
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); toast.success('Retur di-approve.') } catch { toast.error('Gagal approve retur.') } }
  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Retur berhasil diposting.') } catch { toast.error('Gagal posting retur.') } }
  const handleVoid = async (reason: string) => {
    await voidRet.mutateAsync({ id: Number(id), reason })
    toast.success('Retur berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('purchase.returns.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (ret?.status === 'draft' && can('purchase.returns.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (ret?.status === 'approved' && can('purchase.returns.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (ret?.status === 'posted' && can('purchase.returns.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    { id: 'product', header: 'Produk', width: 200, render: ({ item }) => <SearchableSelect value={item.product_id} onChange={() => undefined} onSearch={produkApi.search} placeholder="Produk sumber" disabled size="sm" /> },
    { id: 'description', header: 'Deskripsi', width: 200, render: ({ item, isReadOnly, onUpdate }) => <Input aria-label="Deskripsi item retur" value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" /> },
    { id: 'quantity', header: 'Qty', width: 80, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input aria-label="Kuantitas retur" type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right tabular-nums" min={0} max={item.source_quantity} /> },
    { id: 'unit_price', header: 'Harga', width: 120, align: 'right', render: ({ item }) => <Input aria-label="Harga item retur" type="number" value={item.unit_price} disabled className="h-8 text-[12px] text-right tabular-nums" min={0} /> },
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Retur Pembelian" breadcrumb={[{ label: 'Pembelian' }, { label: 'Retur', path: '/purchase/returns' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Retur Pembelian' : 'Retur Pembelian'}
        documentNumber={ret?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Retur', path: '/purchase/returns' }, { label: isCreate ? 'Buat Retur' : (ret?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={ret?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            {isCreate && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => { setSourcePickerType('vendor_bill'); setSourcePickerOpen(true) }}>Pilih Tagihan</Button>
                  <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => { setSourcePickerType('goods_receipt'); setSourcePickerOpen(true) }}>Pilih Penerimaan</Button>
                  {sourceNumber && <span className="text-[13px] font-medium text-[#5c9ead]">{sourceNumber}</span>}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('vendor_id') ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isEditable} error={errors.vendor_id?.message} selectedOptions={ret?.vendor ? [{ value: ret.vendor.id, label: ret.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>
            {(ret?.vendor_bill_number || ret?.goods_receipt_number) && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <p className="text-[13px] text-[#5c9ead]">{ret.vendor_bill_number ?? ret.goods_receipt_number}</p>
              </div>
            )}
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item Retur</p>
            <LineItemsTable items={lines} columns={columns} onAdd={() => undefined} onRemove={() => undefined} onUpdate={(i, field, value) => { setLineErrors([]); setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l)) }} getSubtotal={lineSubtotal} isReadOnly={!isEditable} canAdd={false} canRemove={false} emptyLabel="Pilih tagihan atau penerimaan sebagai sumber retur" />
            {lineErrors.length > 0 && (
              <div role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {lineErrors.map((message) => <p key={message}>{message}</p>)}
              </div>
            )}
            <FormSummary subtotal={subtotal} grandTotal={subtotal} />
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={ret?.number ?? ''} isLoading={voidRet.isPending} />
      <SourceDocumentPicker
        isOpen={isCreate && isSourcePickerOpen}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={handleSourceSelect}
        targetType="purchase.returns"
        sourceType={sourcePickerType ?? undefined}
        vendorId={watch('vendor_id')}
        title={sourcePickerType === 'goods_receipt' ? 'Pilih Penerimaan Barang' : 'Pilih Tagihan Vendor'}
      />
    </>
  )
}
