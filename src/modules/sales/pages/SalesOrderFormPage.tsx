import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { useSalesOrder, useSalesOrderMutations } from '../hooks/useSalesOrderList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { salesOrderSchema, type SalesOrderFormValues } from '../schemas/salesOrderSchema'
import type { DocumentStatus } from '@/types/common.types'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  delivered_quantity?: number
  invoiced_quantity?: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

export default function SalesOrderFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useSalesOrder(id ? Number(id) : undefined)
  const order = data?.data
  const { create, createFromQuotation, update, approve, confirm, cancel } = useSalesOrderMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [isCreatingFromQuotation, setCreatingFromQuotation] = useState(false)

  const status = (order?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || order?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  useEffect(() => {
    const quotationId = searchParams.get('from_quotation')
    if (quotationId && isCreate) {
      setCreatingFromQuotation(true)
      createFromQuotation.mutateAsync(Number(quotationId))
        .then((res) => navigate(`/sales/orders/${res.data.id}`, { replace: true }))
        .catch(() => toast.error('Gagal membuat SO dari quotation.'))
        .finally(() => setCreatingFromQuotation(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (order) {
      reset({
        customer_id: order.customer_id,
        date: order.date,
        payment_term_id: order.payment_term_id,
        delivery_address: order.delivery_address ?? '',
        notes: order.notes ?? '',
      })
      setLines(order.lines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
        delivered_quantity: l.delivered_quantity,
        invoiced_quantity: l.invoiced_quantity,
      })))
    }
  }, [order, reset])

  const handleSaveDraft = handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines: lines.map(({ delivered_quantity: _d, invoiced_quantity: _i, ...l }) => l) })
        toast.success('Sales Order berhasil dibuat.')
        navigate(`/sales/orders/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines: lines.map(({ delivered_quantity: _d, invoiced_quantity: _i, ...l }) => l) } })
        toast.success('Sales Order berhasil diperbarui.')
      }
    } catch { toast.error('Gagal menyimpan Sales Order.') }
  })

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(Number(id))
      toast.success('Sales Order berhasil di-approve.')
    } catch { toast.error('Gagal approve Sales Order.') }
  }

  const handleConfirm = async () => {
    try {
      await confirm.mutateAsync(Number(id))
      toast.success('Sales Order berhasil dikonfirmasi.')
    } catch { toast.error('Gagal konfirmasi Sales Order.') }
  }

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(Number(id))
      toast.success('Sales Order dibatalkan.')
    } catch { toast.error('Gagal membatalkan Sales Order.') }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('sales.orders.create')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (order?.status === 'draft' && can('sales.orders.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (order?.status === 'approved' && can('sales.orders.approve')) {
      actions.push({ id: 'confirm', label: 'Konfirmasi', variant: 'primary', onClick: () => void handleConfirm(), isLoading: confirm.isPending })
    }
    if (['draft', 'approved'].includes(order?.status ?? '') && can('sales.orders.update')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => void handleCancel(), isLoading: cancel.isPending })
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

  if (isCreatingFromQuotation || (!isCreate && isLoading)) {
    return (
      <FormLayout title="Sales Order" breadcrumb={[{ label: 'Sales' }, { label: 'Sales Order', path: '/sales/orders' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
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
              value={watch('payment_term_id') ?? null}
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
            onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))}
            getSubtotal={lineSubtotal}
            isReadOnly={!isEditable}
            addLabel="Tambah Item"
          />
          <FormSummary subtotal={subtotal} grandTotal={subtotal} />
        </div>
      </div>
    </FormLayout>
  )
}
