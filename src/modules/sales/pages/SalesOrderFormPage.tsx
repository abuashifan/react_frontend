import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSummary } from '@/components/shared/form/FormSummary'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { SourceDocumentPicker } from '../components/SourceDocumentPicker'
import { Button } from '@/components/ui/button'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useSalesOrder, useSalesOrderMutations } from '../hooks/useSalesOrderList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { salesOrderSchema, type SalesOrderFormValues } from '../schemas/salesOrderSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { SourceDocumentItem } from '../services/sourceDocumentApi'
import { validateSalesLines } from '../services/salesFormValidation'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  delivered_quantity?: number
  invoiced_quantity?: number
  quotation_line_id?: number
  source_line_type?: string
  source_line_id?: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

function toOrderLine(line: EditableLine): Omit<EditableLine, 'delivered_quantity' | 'invoiced_quantity'> {
  const { delivered_quantity, invoiced_quantity, ...editable } = line
  void delivered_quantity
  void invoiced_quantity
  return editable
}

export default function SalesOrderFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const query = useSalesOrder(id ? Number(id) : undefined)
  const { data, isLoading } = query
  const order = data?.data
  const { create, update, approve, confirm, cancel } = useSalesOrderMutations()

  const { control, getValues, register, handleSubmit, setError, setValue, reset, formState: { errors, isSubmitting } } = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })
  const customerId = useWatch({ control, name: 'customer_id' })
  const paymentTermId = useWatch({ control, name: 'payment_term_id' })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [lineErrors, setLineErrors] = useState<string[]>([])
  const [isSourceOpen, setSourceOpen] = useState(false)
  const [quotationId, setQuotationId] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'confirm' | 'cancel' | null>(null)

  const status = (order?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || order?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  const formDraft = usePersistentFormDraft<SalesOrderFormValues, { lines: EditableLine[]; quotationId: number | null }>({
    draftKey: `sales.order.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: { lines, quotationId },
    onRestoreExtra: (extra) => {
      setLines(extra.lines.length ? extra.lines : [{ ...DEFAULT_LINE }])
      setQuotationId(extra.quotationId)
    },
    enabled: isEditable,
  })

  useEffect(() => {
    if (order) {
      reset({
        customer_id: order.customer_id,
        date: order.date,
        payment_term_id: order.payment_term_id,
        delivery_address: order.delivery_address ?? '',
        notes: order.notes ?? '',
      })
      const timer = window.setTimeout(() => {
        setLines(order.lines.map((l) => ({
          product_id: l.product_id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount_percent: l.discount_percent,
          delivered_quantity: l.delivered_quantity,
          invoiced_quantity: l.invoiced_quantity,
        })))
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [order, reset])

  const handleSaveDraft = handleSubmit(async (values) => {
    const nextLineErrors = validateSalesLines(lines)
    setLineErrors(nextLineErrors)
    if (nextLineErrors.length > 0) return
    try {
      const payload = { ...values, quotation_id: quotationId ?? undefined, lines: lines.map(toOrderLine) }
      if (isCreate) {
        const res = await create.mutateAsync(payload)
        formDraft.clearDraft()
        toast.success('Sales Order berhasil dibuat.')
        navigate(`/sales/orders/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        formDraft.clearDraft()
        toast.success('Sales Order berhasil diperbarui.')
      }
    } catch (error) {
      applyApiValidationErrors(error, setError, { order_date: 'date' })
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan Sales Order.'))
    }
  })

  const handleSourceSelect = (source: SourceDocumentItem) => {
    setQuotationId(source.source_id)
    if (typeof source.header.customer_id === 'number') setValue('customer_id', source.header.customer_id)
    setLines(source.lines.map((line) => ({
      product_id: typeof line.product_id === 'number' ? line.product_id : null,
      description: String(line.description ?? ''),
      quantity: Number(line.remaining_quantity ?? line.quantity ?? 0),
      unit_price: Number(line.unit_price ?? 0),
      discount_percent: line.discount_type === 'percent' ? Number(line.discount_value ?? 0) : 0,
      quotation_line_id: Number(line.quotation_line_id ?? line.id),
      source_line_type: String(line.source_line_type ?? 'sales_quotation_line'),
      source_line_id: Number(line.source_line_id ?? line.id),
    })))
    setLineErrors([])
  }

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(Number(id))
      toast.success('Sales Order berhasil di-approve.')
      setConfirmAction(null)
    } catch { toast.error('Gagal approve Sales Order.') }
  }

  const handleConfirm = async () => {
    try {
      await confirm.mutateAsync(Number(id))
      toast.success('Sales Order berhasil dikonfirmasi.')
      setConfirmAction(null)
    } catch { toast.error('Gagal konfirmasi Sales Order.') }
  }

  const handleCancel = async (reason: string) => {
    try {
      await cancel.mutateAsync({ id: Number(id), reason })
      toast.success('Sales Order dibatalkan.')
      setConfirmAction(null)
    } catch { toast.error('Gagal membatalkan Sales Order.') }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can(isCreate ? 'sales.orders.create' : 'sales.orders.edit')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (order?.status === 'draft' && can('sales.orders.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => setConfirmAction('approve'), isLoading: approve.isPending })
    }
    if (order?.status === 'approved' && can('sales.orders.approve')) {
      actions.push({ id: 'confirm', label: 'Konfirmasi', variant: 'primary', onClick: () => setConfirmAction('confirm'), isLoading: confirm.isPending })
    }
    if (['draft', 'approved'].includes(order?.status ?? '') && can('sales.orders.cancel')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => setConfirmAction('cancel'), isLoading: cancel.isPending })
    }
  }

  const showTracking = !isCreate && order

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product',
      header: 'Produk',
      width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect
          value={item.product_id}
          onChange={(v) => onUpdate('product_id', v)}
          onSearch={produkApi.search}
          placeholder="Pilih produk..."
          disabled={isReadOnly}
          size="sm"
        />
      ),
    },
    {
      id: 'description',
      header: 'Deskripsi',
      width: 180,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" />
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      width: 80,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
    {
      id: 'unit_price',
      header: 'Harga',
      width: 120,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.unit_price} onChange={(e) => onUpdate('unit_price', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
    {
      id: 'discount',
      header: 'Dis%',
      width: 70,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.discount_percent} onChange={(e) => onUpdate('discount_percent', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} max={100} />
      ),
    },
    ...(showTracking ? [
      {
        id: 'delivered',
        header: 'Terkirim',
        width: 90,
        align: 'right' as const,
        render: ({ item }: { item: EditableLine }) => (
          <span className="text-[12px] tabular-nums text-[#64748b]">{item.delivered_quantity ?? 0}</span>
        ),
      },
      {
        id: 'invoiced',
        header: 'Diinvoice',
        width: 90,
        align: 'right' as const,
        render: ({ item }: { item: EditableLine }) => (
          <span className="text-[12px] tabular-nums text-[#64748b]">{item.invoiced_quantity ?? 0}</span>
        ),
      },
    ] : []),
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Sales Order" breadcrumb={[{ label: 'Sales' }, { label: 'Sales Order', path: '/sales/orders' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  if (!isCreate && query.isError) {
    return (
      <FormLayout title="Sales Order" breadcrumb={[{ label: 'Sales' }, { label: 'Sales Order', path: '/sales/orders' }, { label: 'Gagal dimuat' }]}>
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Sales Order gagal dimuat" />
      </FormLayout>
    )
  }

  return (
    <>
    <FormLayout
      title={isCreate ? 'Buat Sales Order' : 'Sales Order'}
      documentNumber={order?.number}
      status={status}
      breadcrumb={[
        { label: 'Sales' },
        { label: 'Sales Order', path: '/sales/orders' },
        { label: isCreate ? 'Buat SO' : (order?.number ?? '') },
      ]}
      bottomBar={<DocumentActionBar documentStatus={status} documentNumber={order?.number} actions={actions} />}
    >
      <div className="space-y-3">
        <FormSection title="Header">
          {isCreate && can('sales.orders.convert') && (
            <div className="md:col-span-2">
              <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => setSourceOpen(true)}>
                {quotationId ? 'Ganti Quotation Sumber' : 'Pilih Quotation Sumber'}
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Customer <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              value={customerId ?? null}
              onChange={(v) => setValue('customer_id', v as number)}
              onSearch={(q) => kontakApi.search(q, 'customer')}
              placeholder="Pilih customer..."
              disabled={!isEditable}
              error={errors.customer_id?.message}
              selectedOptions={order?.customer ? [{ value: order.customer.id, label: order.customer.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Tanggal <span className="text-red-500">*</span>
            </Label>
            <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
            {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
            <SearchableSelect
              value={paymentTermId ?? null}
              onChange={(v) => setValue('payment_term_id', v)}
              onSearch={paymentTermsApi.search}
              placeholder="Pilih syarat pembayaran..."
              disabled={!isEditable}
              selectedOptions={order?.payment_term ? [{ value: order.payment_term.id, label: order.payment_term.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat Pengiriman</Label>
            <Textarea {...register('delivery_address')} disabled={!isEditable} placeholder="Alamat pengiriman..." className="resize-none text-[13px]" rows={2} />
          </div>

          {order?.quotation_number && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Quotation</Label>
              <p className="text-[13px] font-medium text-[#5c9ead]">{order.quotation_number}</p>
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
          {lineErrors.length > 0 && <div role="alert" className="mt-2 space-y-1 text-[11px] text-red-600">{lineErrors.map((message) => <p key={message}>{message}</p>)}</div>}
          <FormSummary subtotal={subtotal} grandTotal={subtotal} />
        </div>
      </div>
    </FormLayout>
    <SourceDocumentPicker
      isOpen={isSourceOpen}
      onClose={() => setSourceOpen(false)}
      onSelect={handleSourceSelect}
      targetType="sales.orders"
      sourceType="sales_quotation"
      customerId={customerId}
      title="Pilih Quotation"
    />
    <ConfirmDialog
      open={confirmAction !== null}
      onOpenChange={(open) => !open && setConfirmAction(null)}
      title={confirmAction === 'approve' ? 'Approve Sales Order' : confirmAction === 'confirm' ? 'Konfirmasi Sales Order' : 'Batalkan Sales Order'}
      description="Perubahan status ini memengaruhi kelayakan dokumen turunan dan kuantitas yang dapat diproses."
      confirmLabel={confirmAction === 'approve' ? 'Approve' : confirmAction === 'confirm' ? 'Konfirmasi' : 'Batalkan'}
      variant={confirmAction === 'cancel' ? 'destructive' : 'default'}
      requireReason={confirmAction === 'cancel'}
      isLoading={approve.isPending || confirm.isPending || cancel.isPending}
      onConfirm={(reason) => {
        if (confirmAction === 'approve') void handleApprove()
        if (confirmAction === 'confirm') void handleConfirm()
        if (confirmAction === 'cancel' && reason) void handleCancel(reason)
      }}
    />
    </>
  )
}
