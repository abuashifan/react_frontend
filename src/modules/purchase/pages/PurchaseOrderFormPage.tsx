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
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { usePurchaseOrder, usePurchaseOrderMutations } from '../hooks/usePurchaseOrderList'
import { toPurchaseOrderPayload } from '../services/purchaseOrderAdapter'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { purchaseOrderSchema, type PurchaseOrderFormValues } from '../schemas/purchaseOrderSchema'
import { purchaseOrderApi } from '../services/purchaseOrderApi'
import type { RawPurchaseOrder } from '../types/purchaseOrder.types'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import { cn, fieldErrorClass, toDateInputValue } from '@/lib/utils'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface EditableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  received_quantity?: number
  billed_quantity?: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, product: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

function toPurchaseOrderLine(line: EditableLine): Omit<EditableLine, 'received_quantity' | 'billed_quantity'> {
  const { received_quantity, billed_quantity, ...editable } = line
  void received_quantity
  void billed_quantity
  return editable
}

export default function PurchaseOrderFormPage() {
  const { id } = useParams()
  const [outerSearchParams] = useSearchParams()
  // `/purchase/orders/create` dan `/purchase/orders/:id` merender komponen yang sama, dan
  // React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya param
  // yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang sebelumnya
  // dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru setiap kali id
  // record berubah. Mode create juga bisa datang dari `?from_request=<PR id>` (konversi PR →
  // PO) — itu dianggap instance yang berbeda dari create kosong biasa, jadi ikut jadi bagian
  // key supaya berpindah antar "create dari PR X" dan "create kosong" juga dapat instance bersih.
  const fromRequestId = outerSearchParams.get('from_request')
  return <PurchaseOrderFormPageContent key={id ?? fromRequestId ?? 'create'} />
}

function PurchaseOrderFormPageContent() {
  // `navigate` masih dipakai alur deep link yang tidak lahir dari tab.
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = usePurchaseOrder(id ? Number(id) : undefined)
  const po = data?.data
  const { create, createFromRequest, update, approve, confirm, cancel } = usePurchaseOrderMutations()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang

  // ditolak ikut ditandai, bukan cuma toast.

  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isCreatingFromRequest, setCreatingFromRequest] = useState(false)

  const status = (po?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || po?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)
  const showTracking = !isCreate && po

  useEffect(() => {
    const prId = searchParams.get('from_request')
    if (prId && isCreate) {
      setCreatingFromRequest(true)
      createFromRequest.mutateAsync(Number(prId))
        .then((res) => navigate(`/purchase/orders/${res.data.id}`, { replace: true }))
        .catch((convertError: unknown) => toast.error(getApiErrorMessage(convertError, 'Gagal membuat PO dari PR.')))
        .finally(() => setCreatingFromRequest(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (po) {
      reset({ vendor_id: po.vendor_id, date: toDateInputValue(po.date), payment_term_id: po.payment_term_id, expected_delivery_date: toDateInputValue(po.expected_delivery_date), notes: po.notes ?? '' })
      setLines(po.lines.map((l) => ({
        product_id: l.product_id,
        product: l.product ?? null,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price, discount_percent: l.discount_percent,
        received_quantity: l.received_quantity, billed_quantity: l.billed_quantity,
      })))
    }
  }, [po, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<PurchaseOrderFormValues, EditableLine[]>({
    draftKey: `purchase.order.${id ?? searchParams.get('from_request') ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [DEFAULT_LINE]),
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<PurchaseOrderFormValues, RawPurchaseOrder>({
    id,
    basePath: '/purchase/orders',
    createLabel: 'Purchase Order Baru',
    getRecordLabel: (record) => record.order_number,
    sequenceQueryKey: ['purchase', 'orders', 'sequence'],
    fetchAll: async () => (await purchaseOrderApi.listAll()).data,
    handleSubmit,
    save: async (values, creating) => {
      const payload = toPurchaseOrderPayload(values, lines.map(toPurchaseOrderLine))
      if (creating) await create.mutateAsync(payload)
      else await update.mutateAsync({ id: Number(id), payload })
    },
    onSaved: () => {
      formDraft.clearDraft()
      setLineErrors({})
    },
    successMessage: (creating) => (creating ? 'Purchase Order berhasil dibuat.' : 'Purchase Order berhasil diperbarui.'),
    onError: (saveError) => {
      // Backend memakai nama kolom DB (`order_date`, `expected_date`), form memakai
      // `date` dan `expected_delivery_date` — lihat `toPurchaseOrderPayload`.
      setLineErrors(getApiLineErrors(saveError))
      applyApiValidationErrors(saveError, setError, { order_date: 'date', expected_date: 'expected_delivery_date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan Purchase Order.'))
    },
    canSave: isEditable,
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); toast.success('PO di-approve.') } catch (approveError) { toast.error(getApiErrorMessage(approveError, 'Gagal approve PO.')) } }
  const handleConfirm = async () => { try { await confirm.mutateAsync(Number(id)); toast.success('PO dikonfirmasi.') } catch (confirmError) { toast.error(getApiErrorMessage(confirmError, 'Gagal konfirmasi PO.')) } }
  const handleCancel = async () => { try { await cancel.mutateAsync(Number(id)); toast.success('PO dibatalkan.') } catch (cancelError) { toast.error(getApiErrorMessage(cancelError, 'Gagal membatalkan PO.')) } }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('purchase.orders.create')) {
    actions.push({ id: 'save', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (po?.status === 'draft' && can('purchase.orders.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (po?.status === 'approved' && can('purchase.orders.approve')) {
      actions.push({ id: 'confirm', label: 'Konfirmasi', variant: 'primary', onClick: () => void handleConfirm(), isLoading: confirm.isPending })
    }
    if (['draft', 'approved'].includes(po?.status ?? '') && can('purchase.orders.cancel')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => void handleCancel(), isLoading: cancel.isPending })
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
      id: 'description', header: 'Deskripsi', width: 180,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" />
      ),
    },
    {
      id: 'quantity', header: 'Qty', width: 80, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
    {
      id: 'unit_price', header: 'Harga', width: 120, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.unit_price} onChange={(e) => onUpdate('unit_price', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
    {
      id: 'discount', header: 'Dis%', width: 70, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.discount_percent} onChange={(e) => onUpdate('discount_percent', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} max={100} />
      ),
    },
    ...(showTracking ? [
      { id: 'received', header: 'Diterima', width: 90, align: 'right' as const, render: ({ item }: { item: EditableLine }) => <span className="text-[12px] tabular-nums text-[#64748b]">{item.received_quantity ?? 0}</span> },
      { id: 'billed', header: 'Ditagih', width: 90, align: 'right' as const, render: ({ item }: { item: EditableLine }) => <span className="text-[12px] tabular-nums text-[#64748b]">{item.billed_quantity ?? 0}</span> },
    ] : []),
  ]

  if (isCreatingFromRequest || (!isCreate && isLoading)) {
    return (
      <FormLayout title="Purchase Order" breadcrumb={[{ label: 'Pembelian' }, { label: 'Purchase Order', path: '/purchase/orders' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout
      title={isCreate ? 'Buat Purchase Order' : 'Purchase Order'}
      documentNumber={po?.number}
      status={status}
      readOnly={!isEditable}
      breadcrumb={[{ label: 'Pembelian' }, { label: 'Purchase Order', path: '/purchase/orders' }, { label: isCreate ? 'Buat PO' : (po?.number ?? '') }]}
      headerActions={
        <>
          <RecordNavButtons {...navProps} isBusy={isSubmitting} />
          <DocumentActionBar placement="header" documentStatus={status} documentNumber={po?.number} actions={actions} />
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
              selectedOptions={po?.vendor ? [{ value: po.vendor.id, label: po.vendor.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
            <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
            <FieldError message={errors.date?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
            <SearchableSelect
              value={watch('payment_term_id') ?? null}
              onChange={(v) => setValue('payment_term_id', v)}
              onSearch={paymentTermsApi.search}
              placeholder="Pilih syarat pembayaran..."
              disabled={!isEditable}
              error={errors.payment_term_id?.message}
              selectedOptions={po?.payment_term ? [{ value: po.payment_term.id, label: po.payment_term.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tgl Pengiriman</Label>
            <Input {...register('expected_delivery_date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.expected_delivery_date))} />
            <FieldError message={errors.expected_delivery_date?.message} />
          </div>

          {po?.purchase_request_number && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari PR</Label>
              <p className="text-[13px] font-medium text-[#5c9ead]">{po.purchase_request_number}</p>
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
