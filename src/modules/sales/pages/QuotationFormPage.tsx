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
import { useQuotation, useQuotationMutations } from '../hooks/useQuotationList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { salesOrderApi } from '../services/salesOrderApi'
import { quotationSchema, type QuotationFormValues } from '../schemas/quotationSchema'
import type { DocumentStatus } from '@/types/common.types'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

export default function QuotationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useQuotation(id ? Number(id) : undefined)
  const quotation = data?.data
  const { create, update, send, approve, accept, reject, cancel } = useQuotationMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [isConverting, setConverting] = useState(false)

  const status = (quotation?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || quotation?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  useEffect(() => {
    if (quotation) {
      reset({
        customer_id: quotation.customer_id,
        date: quotation.date,
        expiry_date: quotation.expiry_date ?? '',
        notes: quotation.notes ?? '',
      })
      setLines(quotation.lines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
      })))
    }
  }, [quotation, reset])

  const updateLine = (index: number, field: string, value: unknown) => {
    setLines((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  const handleSaveDraft = handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines })
        toast.success('Draft berhasil disimpan.')
        navigate(`/sales/quotations/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines } })
        toast.success('Draft berhasil diperbarui.')
      }
    } catch {
      toast.error('Gagal menyimpan draft.')
    }
  })

  const handleSend = async () => {
    try {
      await send.mutateAsync(Number(id))
      toast.success('Quotation berhasil dikirim.')
    } catch { toast.error('Gagal mengirim quotation.') }
  }

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(Number(id))
      toast.success('Quotation berhasil di-approve.')
    } catch { toast.error('Gagal approve quotation.') }
  }

  const handleAccept = async () => {
    try {
      await accept.mutateAsync(Number(id))
      toast.success('Quotation diterima.')
    } catch { toast.error('Gagal menerima quotation.') }
  }

  const handleReject = async () => {
    try {
      await reject.mutateAsync(Number(id))
      toast.success('Quotation ditolak.')
    } catch { toast.error('Gagal menolak quotation.') }
  }

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync(Number(id))
      toast.success('Quotation dibatalkan.')
    } catch { toast.error('Gagal membatalkan quotation.') }
  }

  const handleConvertToSO = async () => {
    setConverting(true)
    try {
      const res = await salesOrderApi.createFromQuotation(Number(id))
      toast.success('Sales Order berhasil dibuat.')
      navigate(`/sales/orders/${res.data.id}`)
    } catch { toast.error('Gagal membuat Sales Order.') }
    finally { setConverting(false) }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('sales.quotations.create')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (quotation?.status === 'draft' && can('sales.quotations.update')) {
      actions.push({ id: 'send', label: 'Kirim', variant: 'primary', onClick: () => void handleSend(), isLoading: send.isPending })
    }
    if (quotation?.status === 'sent' && can('sales.quotations.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
      actions.push({ id: 'reject', label: 'Tolak', variant: 'neutral', onClick: () => void handleReject(), isLoading: reject.isPending })
    }
    if (quotation?.status === 'approved' && can('sales.quotations.approve')) {
      actions.push({ id: 'accept', label: 'Terima', variant: 'primary', onClick: () => void handleAccept(), isLoading: accept.isPending })
      actions.push({ id: 'reject', label: 'Tolak', variant: 'neutral', onClick: () => void handleReject(), isLoading: reject.isPending })
    }
    if (quotation?.status === 'accepted' && can('sales.orders.create')) {
      actions.push({ id: 'convert', label: 'Convert ke SO', variant: 'primary', onClick: () => void handleConvertToSO(), isLoading: isConverting })
    }
    if (['draft', 'sent', 'approved'].includes(quotation?.status ?? '') && can('sales.quotations.update')) {
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
        <Input
          value={item.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          disabled={isReadOnly}
          placeholder="Deskripsi item..."
          className="h-8 text-[12px]"
        />
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      width: 80,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate('quantity', Number(e.target.value))}
          disabled={isReadOnly}
          className="h-8 text-[12px] text-right"
          min={0}
        />
      ),
    },
    {
      id: 'unit_price',
      header: 'Harga',
      width: 120,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input
          type="number"
          value={item.unit_price}
          onChange={(e) => onUpdate('unit_price', Number(e.target.value))}
          disabled={isReadOnly}
          className="h-8 text-[12px] text-right"
          min={0}
        />
      ),
    },
    {
      id: 'discount',
      header: 'Diskon %',
      width: 80,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input
          type="number"
          value={item.discount_percent}
          onChange={(e) => onUpdate('discount_percent', Number(e.target.value))}
          disabled={isReadOnly}
          className="h-8 text-[12px] text-right"
          min={0}
          max={100}
        />
      ),
    },
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Quotation" breadcrumb={[{ label: 'Sales' }, { label: 'Quotation', path: '/sales/quotations' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout
      title={isCreate ? 'Buat Quotation' : 'Quotation'}
      documentNumber={quotation?.number}
      status={status}
      breadcrumb={[
        { label: 'Sales' },
        { label: 'Quotation', path: '/sales/quotations' },
        { label: isCreate ? 'Buat Quotation' : (quotation?.number ?? '') },
      ]}
      bottomBar={<DocumentActionBar documentStatus={status} documentNumber={quotation?.number} actions={actions} />}
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
              selectedOptions={quotation?.customer ? [{ value: quotation.customer.id, label: quotation.customer.name }] : []}
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
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Expired Date</Label>
            <Input {...register('expiry_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
            <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan tambahan..." className="resize-none text-[13px]" rows={2} />
          </div>
        </FormSection>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item</p>
          <LineItemsTable
            items={lines}
            columns={columns}
            onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
            onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
            onUpdate={(i, field, value) => updateLine(i, field, value)}
            getSubtotal={lineSubtotal}
            isReadOnly={!isEditable}
            addLabel="Tambah Item"
            emptyLabel="Belum ada item"
          />
          <FormSummary subtotal={subtotal} grandTotal={subtotal} />
        </div>
      </div>
    </FormLayout>
  )
}
