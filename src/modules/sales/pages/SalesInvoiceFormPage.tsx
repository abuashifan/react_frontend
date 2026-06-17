import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSummary } from '@/components/shared/form/FormSummary'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { DocumentLockedBanner } from '@/components/shared/document/DocumentLockedBanner'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useSalesInvoice, useSalesInvoiceMutations } from '../hooks/useSalesInvoiceList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { salesInvoiceSchema, type SalesInvoiceFormValues } from '../schemas/salesInvoiceSchema'
import type { DocumentStatus } from '@/types/common.types'
import { toDateInputValue } from '@/lib/utils'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 }

function lineBase(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}


export default function SalesInvoiceFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useSalesInvoice(id ? Number(id) : undefined)
  const invoice = data?.data
  const { create, update, approve, post, void: voidInv } = useSalesInvoiceMutations()

  const { control, getValues, register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<SalesInvoiceFormValues>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })
  const customerId = useWatch({ control, name: 'customer_id' })
  const paymentTermId = useWatch({ control, name: 'payment_term_id' })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [isVoidOpen, setVoidOpen] = useState(false)

  const status = (invoice?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || invoice?.status === 'draft'
  const hasPostedDependences = ['partially_paid', 'paid'].includes(invoice?.status ?? '')

  const subtotal = lines.reduce((s, l) => s + lineBase(l), 0)
  const taxAmount = lines.reduce((s, l) => s + lineBase(l) * (l.tax_percent / 100), 0)
  const grandTotal = subtotal + taxAmount

  useEffect(() => {
    if (invoice) {
      reset({
        customer_id: invoice.customer_id,
        date: toDateInputValue(invoice.date),
        due_date: toDateInputValue(invoice.due_date),
        payment_term_id: invoice.payment_term_id,
        notes: invoice.notes ?? '',
      })
      const timer = window.setTimeout(() => {
        setLines(invoice.lines.map((l) => ({
          product_id: l.product_id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount_percent: l.discount_percent,
          tax_percent: l.tax_percent,
        })))
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [invoice, reset])

  const formDraft = usePersistentFormDraft<SalesInvoiceFormValues, EditableLine[]>({
    draftKey: `sales.invoice.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [{ ...DEFAULT_LINE }]),
    enabled: isEditable,
  })

  const handleDiscardDraft = () => {
    if (invoice) {
      reset({
        customer_id: invoice.customer_id,
        date: toDateInputValue(invoice.date),
        due_date: toDateInputValue(invoice.due_date),
        payment_term_id: invoice.payment_term_id,
        notes: invoice.notes ?? '',
      })
      setLines(invoice.lines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
        tax_percent: l.tax_percent,
      })))
    } else {
      reset({ date: new Date().toISOString().slice(0, 10) })
      setLines([{ ...DEFAULT_LINE }])
    }
    formDraft.discardDraft()
    toast.success('Draft lokal dibuang.')
  }

  const handleSaveDraft = handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines })
        formDraft.clearDraft()
        toast.success('Invoice berhasil dibuat.')
        navigate(`/sales/invoices/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines } })
        formDraft.clearDraft()
        toast.success('Invoice berhasil diperbarui.')
      }
    } catch { toast.error('Gagal menyimpan Invoice.') }
  })

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Invoice berhasil di-approve.')
    } catch { toast.error('Gagal approve invoice.') }
  }

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Invoice berhasil diposting.')
    } catch { toast.error('Gagal memposting invoice.') }
  }

  const handleVoid = async (reason: string) => {
    await voidInv.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Invoice berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('sales.invoices.create')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (isEditable && formDraft.isRestored) {
    actions.push({ id: 'discard_draft', label: 'Buang Draft', variant: 'neutral', onClick: handleDiscardDraft })
  }
  if (!isCreate) {
    if (invoice?.status === 'draft' && can('sales.invoices.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (invoice?.status === 'approved' && can('sales.invoices.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (invoice?.status === 'posted' && !hasPostedDependences && can('sales.invoices.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product',
      header: 'Produk',
      width: 180,
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
      width: 160,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" />
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      width: 70,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
    {
      id: 'unit_price',
      header: 'Harga',
      width: 110,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.unit_price} onChange={(e) => onUpdate('unit_price', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
    {
      id: 'discount',
      header: 'Dis%',
      width: 65,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.discount_percent} onChange={(e) => onUpdate('discount_percent', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} max={100} />
      ),
    },
    {
      id: 'tax',
      header: 'Pajak%',
      width: 65,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.tax_percent} onChange={(e) => onUpdate('tax_percent', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} max={100} />
      ),
    },
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Invoice Penjualan" breadcrumb={[{ label: 'Sales' }, { label: 'Invoice', path: '/sales/invoices' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Invoice' : 'Invoice Penjualan'}
        documentNumber={invoice?.number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Invoice', path: '/sales/invoices' },
          { label: isCreate ? 'Buat Invoice' : (invoice?.number ?? '') },
        ]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={invoice?.number} actions={actions} />}
      >
        <div className="space-y-3">
          {hasPostedDependences && (
            <DocumentLockedBanner
              dependences={[{ type: 'Penerimaan', number: 'Lihat penerimaan terkait', status: 'posted', path: `/sales/receipts?invoice_id=${id}` }]}
            />
          )}

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
                selectedOptions={invoice?.customer ? [{ value: invoice.customer.id, label: invoice.customer.name }] : []}
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
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jatuh Tempo</Label>
              <Input {...register('due_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
              <SearchableSelect
                value={paymentTermId ?? null}
                onChange={(v) => setValue('payment_term_id', v)}
                onSearch={paymentTermsApi.search}
                placeholder="Pilih syarat pembayaran..."
                disabled={!isEditable}
                selectedOptions={invoice?.payment_term ? [{ value: invoice.payment_term.id, label: invoice.payment_term.name }] : []}
              />
            </div>

            {(invoice?.sales_order_number || invoice?.delivery_order_number || invoice?.proforma_number) && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <p className="text-[13px] text-[#5c9ead]">
                  {invoice.sales_order_number ?? invoice.delivery_order_number ?? invoice.proforma_number}
                </p>
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
              getSubtotal={lineBase}
              isReadOnly={!isEditable}
              addLabel="Tambah Item"
            />
            <FormSummary
              subtotal={subtotal}
              taxAmount={taxAmount}
              grandTotal={grandTotal}
              paidAmount={invoice?.paid_amount}
              balanceDue={invoice?.balance_due}
            />
          </div>
        </div>
      </FormLayout>

      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={invoice?.number ?? ''}
        isLoading={voidInv.isPending}
      />
    </>
  )
}
