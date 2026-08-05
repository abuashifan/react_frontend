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
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useDeliveryOrder, useDeliveryOrderMutations } from '../hooks/useDeliveryOrderList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { deliveryOrderSchema, type DeliveryOrderFormValues } from '../schemas/deliveryOrderSchema'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface EditableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, product: null, description: '', quantity: 1 }

export default function DeliveryOrderFormPage() {
  const { id } = useParams()
  // `/sales/delivery-orders/create` dan `/sales/delivery-orders/:id` merender komponen yang
  // sama, dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <DeliveryOrderFormPageContent key={id ?? 'create'} />
}

function DeliveryOrderFormPageContent() {
  const { replaceRecordTab } = useRecordTab()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useDeliveryOrder(id ? Number(id) : undefined)
  const order = data?.data
  const { create, update, ready, ship, deliver, cancel, void: voidDo } = useDeliveryOrderMutations()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<DeliveryOrderFormValues>({
    resolver: zodResolver(deliveryOrderSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang

  // ditolak ikut ditandai, bukan cuma toast.

  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isDeliverConfirming, setDeliverConfirming] = useState(false)

  const status = (order?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || order?.status === 'draft'

  useEffect(() => {
    if (order) {
      reset({
        customer_id: order.customer_id,
        date: order.date,
        warehouse_id: order.warehouse_id,
        delivery_address: order.delivery_address ?? '',
        notes: order.notes ?? '',
      })
      setLines(order.lines.map((l) => ({
        product_id: l.product_id,
        product: l.product,
        description: l.description,
        quantity: l.quantity,
      })))
    }
  }, [order, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<DeliveryOrderFormValues, EditableLine[]>({
    draftKey: `sales.delivery-order.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [DEFAULT_LINE]),
  })

  const handleSaveDraft = handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines })
        formDraft.clearDraft()
        toast.success('Delivery Order berhasil dibuat.')
        replaceRecordTab('/sales/delivery-orders/create', {
          label: res.data.number,
          path: `/sales/delivery-orders/${res.data.id}`,
        })
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines } })
        formDraft.clearDraft()
        toast.success('Delivery Order berhasil diperbarui.')
      }
    } catch (saveError) {
      // Backend memakai `delivery_date`/`shipping_address`, form memakai
      // `date`/`delivery_address` — dipetakan supaya pesan error mendarat di
      // input yang benar.
      setLineErrors(getApiLineErrors(saveError))
      applyApiValidationErrors(saveError, setError, { delivery_date: 'date', shipping_address: 'delivery_address' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan Delivery Order.'))
    }
  })

  const handleReady = async () => {
    try {
      await ready.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('DO siap dikirim.')
    } catch (readyError) { toast.error(getApiErrorMessage(readyError, 'Gagal mengubah status DO.')) }
  }

  const handleShip = async () => {
    try {
      await ship.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('DO dalam pengiriman.')
    } catch (shipError) { toast.error(getApiErrorMessage(shipError, 'Gagal mengubah status DO.')) }
  }

  const handleDeliver = async () => {
    setDeliverConfirming(true)
    try {
      await deliver.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Pengiriman berhasil dikonfirmasi.')
    } catch (deliverError) { toast.error(getApiErrorMessage(deliverError, 'Gagal mengkonfirmasi pengiriman.')) }
    finally { setDeliverConfirming(false) }
  }

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('DO dibatalkan.')
    } catch (cancelError) { toast.error(getApiErrorMessage(cancelError, 'Gagal membatalkan DO.')) }
  }

  const handleVoid = async (reason: string) => {
    await voidDo.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('DO berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('sales.delivery-orders.create')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (order?.status === 'draft' && can('sales.delivery-orders.update')) {
      actions.push({ id: 'ready', label: 'Tandai Siap', variant: 'primary', onClick: () => void handleReady(), isLoading: ready.isPending })
    }
    if (order?.status === 'ready' && can('sales.delivery-orders.update')) {
      actions.push({ id: 'ship', label: 'Kirim', variant: 'primary', onClick: () => void handleShip(), isLoading: ship.isPending })
    }
    if (order?.status === 'shipped' && can('sales.delivery-orders.update')) {
      actions.push({ id: 'deliver', label: 'Konfirmasi Terima', variant: 'primary', onClick: () => void handleDeliver(), isLoading: deliver.isPending || isDeliverConfirming })
    }
    if (['draft', 'ready', 'shipped'].includes(order?.status ?? '') && can('sales.delivery-orders.update')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'neutral', onClick: () => void handleCancel(), isLoading: cancel.isPending })
    }
    if (order?.status === 'delivered' && can('sales.delivery-orders.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
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
          onChange={(v, opt) => {
            onUpdate('product_id', v)
            onUpdate('product', opt ? { id: opt.value, code: opt.sublabel ?? '', name: opt.label } : null)
          }}
          onSearch={produkApi.search}
          placeholder="Pilih produk..."
          selectedOptions={item.product ? [{ value: item.product.id, label: item.product.name, sublabel: item.product.code }] : []}
          disabled={isReadOnly}
          size="sm"
        />
      ),
    },
    {
      id: 'description',
      header: 'Deskripsi',
      width: 220,
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
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Delivery Order" breadcrumb={[{ label: 'Sales' }, { label: 'Delivery Order', path: '/sales/delivery-orders' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Delivery Order' : 'Delivery Order'}
        documentNumber={order?.number}
        status={status}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Delivery Order', path: '/sales/delivery-orders' },
          { label: isCreate ? 'Buat DO' : (order?.number ?? '') },
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
              <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
              <FieldError message={errors.date?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang</Label>
              <SearchableSelect
                value={watch('warehouse_id') ?? null}
                onChange={(v) => setValue('warehouse_id', v)}
                onSearch={gudangApi.search}
                placeholder="Pilih gudang..."
                disabled={!isEditable}
                error={errors.warehouse_id?.message}
                selectedOptions={order?.warehouse ? [{ value: order.warehouse.id, label: order.warehouse.name }] : []}
              />
            </div>

            {order?.sales_order_number && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Sales Order</Label>
                <p className="text-[13px] font-medium text-[#5c9ead]">{order.sales_order_number}</p>
              </div>
            )}

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat Pengiriman</Label>
              <Textarea {...register('delivery_address')} disabled={!isEditable} placeholder="Alamat pengiriman..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.delivery_address))} rows={2} />
              <FieldError message={errors.delivery_address?.message} />
            </div>

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
        documentNumber={order?.number ?? ''}
        isLoading={voidDo.isPending}
      />
    </>
  )
}
