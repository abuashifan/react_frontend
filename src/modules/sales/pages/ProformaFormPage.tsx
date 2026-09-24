import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSummary } from '@/components/shared/form/FormSummary'
import { LineItemsTable, type LineItemColumn, FLUSH_INPUT_CLASS } from '@/components/shared/form/LineItemsTable'
import { AmountInput } from '@/components/shared/form/AmountInput'
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
import { useProforma, useProformaMutations } from '../hooks/useProformaList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { salesInvoiceApi } from '../services/salesInvoiceApi'
import { proformaSchema, type ProformaFormValues } from '../schemas/proformaSchema'
import { proformaApi } from '../services/proformaApi'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface EditableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, product: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

export default function ProformaFormPage() {
  const { id } = useParams()
  // `/sales/proformas/create` dan `/sales/proformas/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <ProformaFormPageContent key={id ?? 'create'} />
}

function ProformaFormPageContent() {
  const { openRecordTab } = useRecordTab()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useProforma(id ? Number(id) : undefined)
  const proforma = data?.data
  const { create, update, issue, accept, cancel } = useProformaMutations()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<ProformaFormValues>({
    resolver: zodResolver(proformaSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang

  // ditolak ikut ditandai, bukan cuma toast.

  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isConverting, setConverting] = useState(false)

  const status = (proforma?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || proforma?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  useEffect(() => {
    if (proforma) {
      reset({
        customer_id: proforma.customer_id,
        date: proforma.date,
        notes: proforma.notes ?? '',
      })
      setLines(proforma.lines.map((l) => ({
        product_id: l.product_id,
        product: l.product,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
      })))
    }
  }, [proforma, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<ProformaFormValues, EditableLine[]>({
    draftKey: `sales.proforma.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [DEFAULT_LINE]),
  })

  const { saveAndClose, navProps } = useRecordFormNavigation<ProformaFormValues>({
    id,
    basePath: '/sales/proformas',
    createLabel: 'Proforma Baru',
    sequenceQueryKey: ['sales', 'proformas', 'adjacent'],
    fetchAdjacent: async (recordId) => (await proformaApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values, creating) => {
      if (creating) await create.mutateAsync({ ...values, lines })
      else await update.mutateAsync({ id: Number(id), payload: { ...values, lines } })
    },
    onSaved: () => {
      formDraft.clearDraft()
      setLineErrors({})
    },
    successMessage: (creating) => (creating ? 'Proforma berhasil dibuat.' : 'Proforma berhasil diperbarui.'),
    onError: (saveError) => {
      // Backend memvalidasi tanggal sebagai `proforma_date`, form memakai `date`.
      setLineErrors(getApiLineErrors(saveError))
      applyApiValidationErrors(saveError, setError, { proforma_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan Proforma.'))
    },
    canSave: isEditable,
  })

  const handleIssue = async () => {
    try {
      await issue.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Proforma berhasil diterbitkan.')
    } catch (issueError) { toast.error(getApiErrorMessage(issueError, 'Gagal menerbitkan proforma.')) }
  }

  const handleAccept = async () => {
    try {
      await accept.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Proforma diterima.')
    } catch (acceptError) { toast.error(getApiErrorMessage(acceptError, 'Gagal menerima proforma.')) }
  }

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Proforma dibatalkan.')
    } catch (cancelError) { toast.error(getApiErrorMessage(cancelError, 'Gagal membatalkan proforma.')) }
  }

  const handleConvertToInvoice = async () => {
    setConverting(true)
    try {
      const res = await salesInvoiceApi.createFromProforma(Number(id))
      formDraft.clearDraft()
      toast.success('Invoice berhasil dibuat dari proforma.')
      // Hasil konversi jadi tab baru, bukan menggantikan tab proforma asalnya.
      openRecordTab({ label: res.data.number, path: `/sales/invoices/${res.data.id}` })
    } catch (convertError) { toast.error(getApiErrorMessage(convertError, 'Gagal membuat invoice dari proforma.')) }
    finally { setConverting(false) }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('sales.proformas.create')) {
    actions.push({ id: 'save_draft', label: 'Simpan & Tutup', variant: 'secondary', onClick: saveAndClose, isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (proforma?.status === 'draft' && can('sales.proformas.update')) {
      actions.push({ id: 'issue', label: 'Terbitkan', variant: 'primary', onClick: () => void handleIssue(), isLoading: issue.isPending })
    }
    if (proforma?.status === 'issued' && can('sales.proformas.update')) {
      actions.push({ id: 'accept', label: 'Terima', variant: 'primary', onClick: () => void handleAccept(), isLoading: accept.isPending })
    }
    if (proforma?.status === 'accepted' && can('sales.invoices.create')) {
      actions.push({ id: 'convert', label: 'Convert ke Invoice', variant: 'primary', onClick: () => void handleConvertToInvoice(), isLoading: isConverting })
    }
    if (['draft', 'issued'].includes(proforma?.status ?? '') && can('sales.proformas.update')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => void handleCancel(), isLoading: cancel.isPending })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product',
      header: 'Produk',
      width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect
          flush
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
      width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className={cn('h-8 text-[12px]', FLUSH_INPUT_CLASS)} />
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      width: 80,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput value={item.quantity} onChange={(v) => onUpdate('quantity', v)} disabled={isReadOnly} decimals={2} ariaLabel="quantity" className={cn(FLUSH_INPUT_CLASS, 'text-right')} />
      ),
    },
    {
      id: 'unit_price',
      header: 'Harga',
      width: 120,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput value={item.unit_price} onChange={(v) => onUpdate('unit_price', v)} disabled={isReadOnly} decimals={2} ariaLabel="unit_price" className={cn(FLUSH_INPUT_CLASS, 'text-right')} />
      ),
    },
    {
      id: 'discount',
      header: 'Dis%',
      width: 70,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <AmountInput value={item.discount_percent} onChange={(v) => onUpdate('discount_percent', v)} disabled={isReadOnly} decimals={2} ariaLabel="discount_percent" className={cn(FLUSH_INPUT_CLASS, 'text-right')} />
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

  return (
    <FormLayout
      title={isCreate ? 'Buat Proforma Invoice' : 'Proforma Invoice'}
      documentNumber={proforma?.number}
      status={status}
      breadcrumb={[
        { label: 'Sales' },
        { label: 'Proforma', path: '/sales/proformas' },
        { label: isCreate ? 'Buat Proforma' : (proforma?.number ?? '') },
      ]}
      headerActions={
        <>
          <RecordNavButtons {...navProps} isBusy={isSubmitting} />
          <DocumentActionBar placement="header" documentStatus={status} documentNumber={proforma?.number} actions={actions} />
        </>
      }
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
              selectedOptions={proforma?.customer ? [{ value: proforma.customer.id, label: proforma.customer.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Tanggal <span className="text-red-500">*</span>
            </Label>
            <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
            <FieldError message={errors.date?.message} />
          </div>

          {proforma?.sales_order_number && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Sales Order</Label>
              <p className="text-[13px] font-medium text-[#5c9ead]">{proforma.sales_order_number}</p>
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
