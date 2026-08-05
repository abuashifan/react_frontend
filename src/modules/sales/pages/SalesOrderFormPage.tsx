import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { FieldError } from '@/components/shared/form/FieldError'
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useSalesOrder, useSalesOrderMutations } from '../hooks/useSalesOrderList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { salesOrderSchema, type SalesOrderFormValues } from '../schemas/salesOrderSchema'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface EditableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  delivered_quantity?: number
  invoiced_quantity?: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, product: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0 }

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
  const { id } = useParams()
  // `/sales/orders/create` dan `/sales/orders/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah. Alur ?from_quotation tetap aman:
  // begitu konversi selesai, `navigate(..., { replace: true })` mengubah `id` di URL
  // sehingga key ini otomatis berubah juga.
  return <SalesOrderFormPageContent key={id ?? 'create'} />
}

function SalesOrderFormPageContent() {
  // `navigate` masih dipakai alur deep link ?from_quotation yang tidak lahir dari tab.
  const navigate = useNavigate()
  const { closeRecordTab } = useRecordTab()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useSalesOrder(id ? Number(id) : undefined)
  const order = data?.data
  const { create, createFromQuotation, update, approve, confirm, cancel } = useSalesOrderMutations()

  const { control, register, handleSubmit, getValues, setValue, setError, reset, formState: { errors, isSubmitting } } = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })
  const customerId = useWatch({ control, name: 'customer_id' })
  const paymentTermId = useWatch({ control, name: 'payment_term_id' })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang

  // ditolak ikut ditandai, bukan cuma toast.

  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isCreatingFromQuotation, setCreatingFromQuotation] = useState(false)

  const status = (order?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || order?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  useEffect(() => {
    const quotationId = searchParams.get('from_quotation')
    if (quotationId && isCreate) {
      const timer = window.setTimeout(() => setCreatingFromQuotation(true), 0)
      createFromQuotation.mutateAsync(Number(quotationId))
        .then((res) => navigate(`/sales/orders/${res.data.id}`, { replace: true }))
        .catch((convertError: unknown) => toast.error(getApiErrorMessage(convertError, 'Gagal membuat SO dari quotation.')))
        .finally(() => setCreatingFromQuotation(false))
      return () => window.clearTimeout(timer)
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
      const timer = window.setTimeout(() => {
        setLines(order.lines.map((l) => ({
          product_id: l.product_id,
          product: l.product,
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


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<SalesOrderFormValues, EditableLine[]>({
    draftKey: `sales.order.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [DEFAULT_LINE]),
  })

  const handleSaveDraft = handleSubmit(async (values) => {
    try {
      if (isCreate) {
        await create.mutateAsync({ ...values, lines: lines.map(toOrderLine) })
        formDraft.clearDraft()
        toast.success('Sales Order berhasil dibuat.')
        closeRecordTab('/sales/orders/create', '/sales/orders')
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines: lines.map(toOrderLine) } })
        formDraft.clearDraft()
        toast.success('Sales Order berhasil diperbarui.')
        closeRecordTab(`/sales/orders/${id}`, '/sales/orders')
      }
    } catch (saveError) {
      // Backend memakai `order_date`/`shipping_address`, form memakai
      // `date`/`delivery_address` — dipetakan supaya pesan error mendarat di
      // input yang benar.
      setLineErrors(getApiLineErrors(saveError))
      applyApiValidationErrors(saveError, setError, { order_date: 'date', shipping_address: 'delivery_address' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan Sales Order.'))
    }
  })

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Sales Order berhasil di-approve.')
    } catch (approveError) { toast.error(getApiErrorMessage(approveError, 'Gagal approve Sales Order.')) }
  }

  const handleConfirm = async () => {
    try {
      await confirm.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Sales Order berhasil dikonfirmasi.')
    } catch (confirmError) { toast.error(getApiErrorMessage(confirmError, 'Gagal konfirmasi Sales Order.')) }
  }

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Sales Order dibatalkan.')
    } catch (cancelError) { toast.error(getApiErrorMessage(cancelError, 'Gagal membatalkan Sales Order.')) }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('sales.orders.create')) {
    actions.push({ id: 'save_draft', label: 'Simpan & Tutup', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
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
          onChange={(v, opt) => {
            onUpdate('product_id', v)
            onUpdate('product', opt ? { id: opt.value, code: opt.sublabel ?? '', name: opt.label } : null)
          }}
          onSearch={produkApi.search}
          placeholder="Pilih produk..."
          disabled={isReadOnly}
          size="sm"
          selectedOptions={item.product ? [{ value: item.product.id, label: item.product.name, sublabel: item.product.code }] : []}
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
      headerActions={<DocumentActionBar placement="header" documentStatus={status} documentNumber={order?.number} actions={actions} />}
    >
      <div className="space-y-3">
        <FormSection title="Header">
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
            <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
            <FieldError message={errors.date?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
            <SearchableSelect
              value={paymentTermId ?? null}
              onChange={(v) => setValue('payment_term_id', v)}
              onSearch={paymentTermsApi.search}
              placeholder="Pilih syarat pembayaran..."
              disabled={!isEditable}
              error={errors.payment_term_id?.message}
              selectedOptions={order?.payment_term ? [{ value: order.payment_term.id, label: order.payment_term.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat Pengiriman</Label>
            <Textarea {...register('delivery_address')} disabled={!isEditable} placeholder="Alamat pengiriman..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.delivery_address))} rows={2} />
            <FieldError message={errors.delivery_address?.message} />
          </div>

          {order?.quotation_number && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Quotation</Label>
              <p className="text-[13px] font-medium text-[#5c9ead]">{order.quotation_number}</p>
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
          <FormSummary subtotal={subtotal} grandTotal={subtotal} />
        </div>
      </div>
    </FormLayout>
  )
}
