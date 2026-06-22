import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSummary } from '@/components/shared/form/FormSummary'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useSalesReturn, useSalesReturnMutations } from '../hooks/useSalesReturnList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { salesReturnSchema, type SalesReturnFormValues } from '../schemas/salesReturnSchema'
import type { DocumentStatus } from '@/types/common.types'
import { SourceDocumentPicker } from '../components/SourceDocumentPicker'
import type { SourceDocumentItem, SourceDocumentType } from '../services/sourceDocumentApi'
import { validateSalesLines } from '../services/salesFormValidation'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  source_quantity: number
  sales_invoice_line_id?: number | null
  delivery_order_line_id?: number | null
}

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price
}

function numberValue(value: unknown): number {
  return Number(value ?? 0)
}

export default function SalesReturnFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const query = useSalesReturn(id ? Number(id) : undefined)
  const { data, isLoading } = query
  const ret = data?.data
  const { create, update, approve, post, void: voidRet } = useSalesReturnMutations()

  const { control, getValues, register, handleSubmit, setError, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<SalesReturnFormValues>({
    resolver: zodResolver(salesReturnSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([])
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'post' | null>(null)
  const [sourcePickerType, setSourcePickerType] = useState<SourceDocumentType | null>(null)
  const [isSourcePickerOpen, setSourcePickerOpen] = useState(false)
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [sourceNumber, setSourceNumber] = useState('')
  const [lineErrors, setLineErrors] = useState<string[]>([])

  const status = (ret?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || ret?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)
  const formDraft = usePersistentFormDraft<SalesReturnFormValues, {
    lines: EditableLine[]
    sourceId: number | null
    sourceNumber: string
    sourceType: SourceDocumentType | null
  }>({
    draftKey: `sales.return.${id ?? 'new'}`,
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
      reset({
        customer_id: ret.customer_id,
        date: ret.date,
        notes: ret.notes ?? '',
      })
      setLines(ret.lines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        source_quantity: l.quantity,
        sales_invoice_line_id: l.sales_invoice_line_id,
        delivery_order_line_id: l.delivery_order_line_id,
      })))
      setSourceId(ret.sales_invoice_id ?? ret.delivery_order_id ?? null)
      setSourceNumber(ret.sales_invoice_number ?? ret.delivery_order_number ?? '')
      setSourcePickerType(ret.sales_invoice_id ? 'sales_invoice' : 'delivery_order')
    }
  }, [ret, reset])

  const handleSaveDraft = handleSubmit(async (values) => {
    const validationErrors = validateSalesLines(lines)
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
      sales_invoice_id: sourcePickerType === 'sales_invoice' ? sourceId : null,
      delivery_order_id: sourcePickerType === 'delivery_order' ? sourceId : null,
      lines: lines.map((line) => ({
        product_id: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        sales_invoice_line_id: line.sales_invoice_line_id,
        delivery_order_line_id: line.delivery_order_line_id,
      })),
    }
    try {
      if (isCreate) {
        const res = await create.mutateAsync(payload)
        formDraft.clearDraft()
        toast.success('Retur berhasil disimpan.')
        navigate(`/sales/returns/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        toast.success('Retur berhasil diperbarui.')
      }
    } catch (error) {
      applyApiValidationErrors(error, setError, { return_date: 'date' })
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan retur.'))
    }
  })

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(Number(id))
      toast.success('Retur berhasil di-approve.')
      setConfirmAction(null)
    } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal approve retur.')) }
  }

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      toast.success('Retur berhasil diposting.')
      setConfirmAction(null)
    } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal memposting retur.')) }
  }

  const handleVoid = async (reason: string) => {
    await voidRet.mutateAsync({ id: Number(id), reason })
    toast.success('Retur berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can(isCreate ? 'sales.returns.create' : 'sales.returns.update')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (ret?.status === 'draft' && can('sales.returns.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => setConfirmAction('approve'), isLoading: approve.isPending })
    }
    if (ret?.status === 'approved' && can('sales.returns.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setConfirmAction('post'), isLoading: post.isPending })
    }
    if (ret?.status === 'posted' && can('sales.returns.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product',
      header: 'Produk',
      width: 200,
      render: ({ item, onUpdate }) => (
        <SearchableSelect value={item.product_id} onChange={(v) => onUpdate('product_id', v)} onSearch={produkApi.search} placeholder="Produk sumber" disabled size="sm" />
      ),
    },
    {
      id: 'description',
      header: 'Deskripsi',
      width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input aria-label="Deskripsi item retur" value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" />
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      width: 80,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input aria-label="Kuantitas retur" type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right tabular-nums" min={0} max={item.source_quantity} />
      ),
    },
    {
      id: 'unit_price',
      header: 'Harga',
      width: 120,
      align: 'right',
      render: ({ item, onUpdate }) => (
        <Input aria-label="Harga item retur" type="number" value={item.unit_price} onChange={(e) => onUpdate('unit_price', Number(e.target.value))} disabled className="h-8 text-[12px] text-right tabular-nums" min={0} />
      ),
    },
  ]

  const handleSourceSelect = (document: SourceDocumentItem) => {
    const sourceType = document.source_type
    setSourcePickerType(sourceType)
    setSourceId(document.source_id)
    setSourceNumber(document.number)
    setValue('customer_id', document.partner_id ?? numberValue(document.header.customer_id))
    setLines(document.lines.map((line) => ({
      product_id: line.product_id == null ? null : numberValue(line.product_id),
      description: String(line.description ?? ''),
      quantity: numberValue(line.remaining_quantity),
      source_quantity: numberValue(line.remaining_quantity),
      unit_price: numberValue(line.unit_price),
      sales_invoice_line_id: sourceType === 'sales_invoice' ? numberValue(line.sales_invoice_line_id ?? line.id) : null,
      delivery_order_line_id: sourceType === 'delivery_order' ? numberValue(line.delivery_order_line_id ?? line.id) : null,
    })))
    setLineErrors([])
    setSourcePickerOpen(false)
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Retur Penjualan" breadcrumb={[{ label: 'Sales' }, { label: 'Retur', path: '/sales/returns' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  if (!isCreate && query.isError) {
    return (
      <FormLayout title="Retur Penjualan" breadcrumb={[{ label: 'Sales' }, { label: 'Retur', path: '/sales/returns' }, { label: 'Gagal dimuat' }]}>
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Retur gagal dimuat" />
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Retur Penjualan' : 'Retur Penjualan'}
        documentNumber={ret?.number}
        status={status}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Retur', path: '/sales/returns' },
          { label: isCreate ? 'Buat Retur' : (ret?.number ?? '') },
        ]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={ret?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            {isCreate && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => { setSourcePickerType('sales_invoice'); setSourcePickerOpen(true) }}>Pilih Invoice</Button>
                  <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => { setSourcePickerType('delivery_order'); setSourcePickerOpen(true) }}>Pilih Delivery Order</Button>
                  {sourceNumber && <span className="text-[13px] font-medium text-[#5c9ead]">{sourceNumber}</span>}
                </div>
              </div>
            )}
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
                selectedOptions={ret?.customer ? [{ value: ret.customer.id, label: ret.customer.name }] : []}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>

            {(ret?.sales_invoice_number || ret?.delivery_order_number) && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <p className="text-[13px] font-medium text-[#5c9ead]">
                  {ret.sales_invoice_number ?? ret.delivery_order_number}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item Retur</p>
            <LineItemsTable
              items={lines}
              columns={columns}
              onAdd={() => undefined}
              onRemove={() => undefined}
              onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))}
              getSubtotal={lineSubtotal}
              isReadOnly={!isEditable}
              canAdd={false}
              canRemove={false}
              emptyLabel="Pilih invoice atau delivery order sebagai sumber retur"
            />
            {lineErrors.length > 0 && (
              <div role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {lineErrors.map((message) => <p key={message}>{message}</p>)}
              </div>
            )}
            <FormSummary subtotal={subtotal} grandTotal={subtotal} />
          </div>
        </div>
      </FormLayout>

      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={ret?.number ?? ''}
        isLoading={voidRet.isPending}
      />
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === 'approve' ? 'Approve Retur' : 'Post Retur'}
        description={confirmAction === 'approve'
          ? 'Retur yang disetujui siap diposting dan tidak lagi dapat diedit.'
          : 'Posting retur akan membentuk dampak stok dan akuntansi.'}
        confirmLabel={confirmAction === 'approve' ? 'Approve Retur' : 'Post Retur'}
        isLoading={approve.isPending || post.isPending}
        onConfirm={() => void (confirmAction === 'approve' ? handleApprove() : handlePost())}
      />
      <SourceDocumentPicker
        isOpen={isCreate && isSourcePickerOpen}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={handleSourceSelect}
        targetType="sales.returns"
        sourceType={sourcePickerType ?? undefined}
        customerId={watch('customer_id')}
        title={sourcePickerType === 'delivery_order' ? 'Pilih Delivery Order' : 'Pilih Invoice Penjualan'}
      />
    </>
  )
}
