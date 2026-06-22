import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
import { useProforma, useProformaMutations } from '../hooks/useProformaList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { salesInvoiceApi } from '../services/salesInvoiceApi'
import { proformaSchema, type ProformaFormValues } from '../schemas/proformaSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { SourceDocumentItem } from '../services/sourceDocumentApi'
import { validateSalesLines } from '../services/salesFormValidation'
import { toDateInputValue } from '@/lib/utils'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  source_line_type?: string
  source_line_id?: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

export default function ProformaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const query = useProforma(id ? Number(id) : undefined)
  const { data, isLoading } = query
  const proforma = data?.data
  const { create, update, issue, accept, cancel } = useProformaMutations()

  const { control, getValues, register, handleSubmit, setError, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ProformaFormValues>({
    resolver: zodResolver(proformaSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [lineErrors, setLineErrors] = useState<string[]>([])
  const [isSourceOpen, setSourceOpen] = useState(false)
  const [salesOrderId, setSalesOrderId] = useState<number | null>(null)
  const [isConverting, setConverting] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'issue' | 'accept' | 'convert' | 'cancel' | null>(null)

  const status = (proforma?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || proforma?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  const formDraft = usePersistentFormDraft<ProformaFormValues, { lines: EditableLine[]; salesOrderId: number | null }>({
    draftKey: `sales.proforma.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: { lines, salesOrderId },
    onRestoreExtra: (extra) => {
      setLines(extra.lines.length ? extra.lines : [{ ...DEFAULT_LINE }])
      setSalesOrderId(extra.salesOrderId)
    },
    enabled: isEditable,
  })

  useEffect(() => {
    if (proforma) {
      reset({
        customer_id: proforma.customer_id,
        date: toDateInputValue(proforma.date),
        expiry_date: toDateInputValue(proforma.expiry_date),
        notes: proforma.notes ?? '',
      })
      setLines(proforma.lines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
      })))
    }
  }, [proforma, reset])

  const handleSaveDraft = handleSubmit(async (values) => {
    const nextLineErrors = validateSalesLines(lines)
    setLineErrors(nextLineErrors)
    if (nextLineErrors.length > 0) return
    try {
      const payload = { ...values, sales_order_id: salesOrderId ?? undefined, lines }
      if (isCreate) {
        const res = await create.mutateAsync(payload)
        formDraft.clearDraft()
        toast.success('Proforma berhasil dibuat.')
        navigate(`/sales/proformas/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        formDraft.clearDraft()
        toast.success('Proforma berhasil diperbarui.')
      }
    } catch (error) {
      applyApiValidationErrors(error, setError, { proforma_date: 'date', valid_until: 'expiry_date' })
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan Proforma.'))
    }
  })

  const handleSourceSelect = (source: SourceDocumentItem) => {
    setSalesOrderId(source.source_id)
    if (typeof source.header.customer_id === 'number') setValue('customer_id', source.header.customer_id)
    setLines(source.lines.map((line) => ({
      product_id: typeof line.product_id === 'number' ? line.product_id : null,
      description: String(line.description ?? ''),
      quantity: Number(line.remaining_quantity ?? line.quantity ?? 0),
      unit_price: Number(line.unit_price ?? 0),
      discount_percent: line.discount_type === 'percent' ? Number(line.discount_value ?? 0) : 0,
      source_line_type: String(line.source_line_type ?? 'sales_order_line'),
      source_line_id: Number(line.source_line_id ?? line.id),
    })))
    setLineErrors([])
  }

  const handleIssue = async () => {
    try {
      await issue.mutateAsync(Number(id))
      toast.success('Proforma berhasil diterbitkan.')
      setConfirmAction(null)
    } catch { toast.error('Gagal menerbitkan proforma.') }
  }

  const handleAccept = async () => {
    try {
      await accept.mutateAsync(Number(id))
      toast.success('Proforma diterima.')
      setConfirmAction(null)
    } catch { toast.error('Gagal menerima proforma.') }
  }

  const handleCancel = async (reason: string) => {
    try {
      await cancel.mutateAsync({ id: Number(id), reason })
      toast.success('Proforma dibatalkan.')
      setConfirmAction(null)
    } catch { toast.error('Gagal membatalkan proforma.') }
  }

  const handleConvertToInvoice = async () => {
    setConverting(true)
    try {
      const res = await salesInvoiceApi.createFromProforma(Number(id))
      toast.success('Invoice berhasil dibuat dari proforma.')
      navigate(`/sales/invoices/${res.data.id}`)
    } catch { toast.error('Gagal membuat invoice dari proforma.') }
    finally { setConverting(false) }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can(isCreate ? 'sales.proformas.create' : 'sales.proformas.edit')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (proforma?.status === 'draft' && can('sales.proformas.issue')) {
      actions.push({ id: 'issue', label: 'Terbitkan', variant: 'primary', onClick: () => setConfirmAction('issue'), isLoading: issue.isPending })
    }
    if (proforma?.status === 'issued' && can('sales.proformas.issue')) {
      actions.push({ id: 'accept', label: 'Terima', variant: 'primary', onClick: () => setConfirmAction('accept'), isLoading: accept.isPending })
    }
    if (proforma?.status === 'accepted' && can('sales.invoices.create')) {
      actions.push({ id: 'convert', label: 'Convert ke Invoice', variant: 'primary', onClick: () => setConfirmAction('convert'), isLoading: isConverting })
    }
    if (['draft', 'issued'].includes(proforma?.status ?? '') && can('sales.proformas.cancel')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => setConfirmAction('cancel'), isLoading: cancel.isPending })
    }
  }

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
      width: 200,
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
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Proforma Invoice" breadcrumb={[{ label: 'Sales' }, { label: 'Proforma', path: '/sales/proformas' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  if (!isCreate && query.isError) {
    return (
      <FormLayout title="Proforma Invoice" breadcrumb={[{ label: 'Sales' }, { label: 'Proforma', path: '/sales/proformas' }, { label: 'Gagal dimuat' }]}>
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Proforma gagal dimuat" />
      </FormLayout>
    )
  }

  return (
    <>
    <FormLayout
      title={isCreate ? 'Buat Proforma Invoice' : 'Proforma Invoice'}
      documentNumber={proforma?.number}
      status={status}
      breadcrumb={[
        { label: 'Sales' },
        { label: 'Proforma', path: '/sales/proformas' },
        { label: isCreate ? 'Buat Proforma' : (proforma?.number ?? '') },
      ]}
      bottomBar={<DocumentActionBar documentStatus={status} documentNumber={proforma?.number} actions={actions} />}
    >
      <div className="space-y-3">
        <FormSection title="Header">
          {isCreate && can('sales.proformas.convert') && (
            <div className="md:col-span-2">
              <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => setSourceOpen(true)}>
                {salesOrderId ? 'Ganti Sales Order Sumber' : 'Pilih Sales Order Sumber'}
              </Button>
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
              selectedOptions={proforma?.customer ? [{ value: proforma.customer.id, label: proforma.customer.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="proforma-valid-until" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Berlaku Sampai</Label>
            <Input id="proforma-valid-until" {...register('expiry_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
            {errors.expiry_date && <p className="text-[11px] text-red-500">{errors.expiry_date.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Tanggal <span className="text-red-500">*</span>
            </Label>
            <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
            {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
          </div>

          {proforma?.sales_order_number && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Sales Order</Label>
              <p className="text-[13px] font-medium text-[#5c9ead]">{proforma.sales_order_number}</p>
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
      targetType="sales.proformas"
      sourceType="sales_order"
      customerId={watch('customer_id') ?? undefined}
      title="Pilih Sales Order"
    />
    <ConfirmDialog
      open={confirmAction !== null}
      onOpenChange={(open) => !open && setConfirmAction(null)}
      title={confirmAction === 'issue' ? 'Terbitkan Proforma' : confirmAction === 'accept' ? 'Terima Proforma' : confirmAction === 'convert' ? 'Convert ke Invoice' : 'Batalkan Proforma'}
      description="Pastikan nilai dan dokumen sumber benar sebelum status proforma diubah."
      confirmLabel={confirmAction === 'issue' ? 'Terbitkan' : confirmAction === 'accept' ? 'Terima' : confirmAction === 'convert' ? 'Convert' : 'Batalkan'}
      variant={confirmAction === 'cancel' ? 'destructive' : 'default'}
      requireReason={confirmAction === 'cancel'}
      isLoading={issue.isPending || accept.isPending || cancel.isPending || isConverting}
      onConfirm={(reason) => {
        if (confirmAction === 'issue') void handleIssue()
        if (confirmAction === 'accept') void handleAccept()
        if (confirmAction === 'convert') void handleConvertToInvoice()
        if (confirmAction === 'cancel' && reason) void handleCancel(reason)
      }}
    />
    </>
  )
}
