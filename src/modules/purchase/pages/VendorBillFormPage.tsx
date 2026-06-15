import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
import { useVendorBill, useVendorBillMutations } from '../hooks/useVendorBillList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { fixedAssetCategoryApi } from '../services/fixedAssetCategoryApi'
import { vendorBillSchema, type VendorBillFormValues } from '../schemas/vendorBillSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { VendorBillLineClassification } from '../types/vendorBill.types'

interface EditableLine {
  product_id: number | null
  line_classification: VendorBillLineClassification
  fixed_asset_category_id: number | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, line_classification: 'inventory', fixed_asset_category_id: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 }

function lineBase(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

export default function VendorBillFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useVendorBill(id ? Number(id) : undefined)
  const bill = data?.data
  const { create, update, approve, post, void: voidBill } = useVendorBillMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<VendorBillFormValues>({
    resolver: zodResolver(vendorBillSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [isVoidOpen, setVoidOpen] = useState(false)

  const status = (bill?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || bill?.status === 'draft'
  const hasPaidDependences = ['partially_paid', 'paid'].includes(bill?.status ?? '')

  const subtotal = lines.reduce((s, l) => s + lineBase(l), 0)
  const taxAmount = lines.reduce((s, l) => s + lineBase(l) * (l.tax_percent / 100), 0)
  const grandTotal = subtotal + taxAmount

  useEffect(() => {
    if (bill) {
      reset({ vendor_id: bill.vendor_id, date: bill.date, due_date: bill.due_date ?? '', payment_term_id: bill.payment_term_id, notes: bill.notes ?? '' })
      setLines(bill.lines.map((l) => ({ product_id: l.product_id, line_classification: l.line_classification ?? 'inventory', fixed_asset_category_id: l.fixed_asset_category_id ?? null, description: l.description, quantity: l.quantity, unit_price: l.unit_price, discount_percent: l.discount_percent, tax_percent: l.tax_percent })))
    }
  }, [bill, reset])

  const handleSave = handleSubmit(async (values) => {
    const linePayloads = lines.map((l) => ({
      product_id: l.line_classification === 'fixed_asset' ? null : l.product_id,
      line_classification: l.line_classification,
      fixed_asset_category_id: l.line_classification === 'fixed_asset' ? l.fixed_asset_category_id : null,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_percent: l.discount_percent,
      tax_percent: l.tax_percent,
    }))
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines: linePayloads })
        toast.success('Tagihan vendor berhasil dibuat.')
        navigate(`/purchase/bills/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines: linePayloads } })
        toast.success('Tagihan vendor berhasil diperbarui.')
      }
    } catch { toast.error('Gagal menyimpan tagihan vendor.') }
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); toast.success('Bill di-approve.') } catch { toast.error('Gagal approve bill.') } }
  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Bill berhasil diposting.') } catch { toast.error('Gagal posting bill.') } }
  const handleVoid = async (reason: string) => {
    await voidBill.mutateAsync({ id: Number(id), reason })
    toast.success('Bill berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('purchase.bills.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (bill?.status === 'draft' && can('purchase.bills.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (bill?.status === 'approved' && can('purchase.bills.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (bill?.status === 'posted' && !hasPaidDependences && can('purchase.bills.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'line_classification', header: 'Tipe', width: 110,
      render: ({ item, isReadOnly, onUpdate }) => (
        <div className="flex gap-1">
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => {
              onUpdate('line_classification', 'inventory')
              onUpdate('fixed_asset_category_id', null)
            }}
            className={`h-7 rounded px-2 text-[11px] font-medium transition-colors ${item.line_classification === 'inventory' ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Inventori
          </button>
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => onUpdate('line_classification', 'fixed_asset')}
            className={`h-7 rounded px-2 text-[11px] font-medium transition-colors ${item.line_classification === 'fixed_asset' ? 'bg-[#f59e0b] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Aset
          </button>
        </div>
      ),
    },
    {
      id: 'product', header: 'Produk / Kategori Aset', width: 200,
      render: ({ item, isReadOnly, onUpdate }) =>
        item.line_classification === 'fixed_asset' ? (
          <SearchableSelect
            value={item.fixed_asset_category_id}
            onChange={(v) => onUpdate('fixed_asset_category_id', v)}
            onSearch={fixedAssetCategoryApi.search}
            placeholder="Pilih kategori aset..."
            disabled={isReadOnly}
            size="sm"
            selectedOptions={[]}
          />
        ) : (
          <SearchableSelect value={item.product_id} onChange={(v) => onUpdate('product_id', v)} onSearch={produkApi.search} placeholder="Pilih produk..." disabled={isReadOnly} size="sm" />
        ),
    },
    { id: 'description', header: 'Deskripsi', width: 150, render: ({ item, isReadOnly, onUpdate }) => <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" /> },
    { id: 'quantity', header: 'Qty', width: 70, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
    { id: 'unit_price', header: 'Harga', width: 110, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.unit_price} onChange={(e) => onUpdate('unit_price', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
    { id: 'discount', header: 'Dis%', width: 65, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.discount_percent} onChange={(e) => onUpdate('discount_percent', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} max={100} /> },
    { id: 'tax', header: 'Pajak%', width: 65, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.tax_percent} onChange={(e) => onUpdate('tax_percent', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} max={100} /> },
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Tagihan Vendor" breadcrumb={[{ label: 'Pembelian' }, { label: 'Tagihan', path: '/purchase/bills' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Tagihan Vendor' : 'Tagihan Vendor'}
        documentNumber={bill?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Tagihan', path: '/purchase/bills' }, { label: isCreate ? 'Buat Bill' : (bill?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={bill?.number} actions={actions} />}
      >
        <div className="space-y-3">
          {hasPaidDependences && (
            <DocumentLockedBanner
              dependences={[{ type: 'Pembayaran', number: 'Lihat pembayaran terkait', status: 'posted', path: `/purchase/payments?bill_id=${id}` }]}
            />
          )}
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('vendor_id') ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isEditable} error={errors.vendor_id?.message} selectedOptions={bill?.vendor ? [{ value: bill.vendor.id, label: bill.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jatuh Tempo</Label>
              <Input {...register('due_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
              <SearchableSelect value={watch('payment_term_id') ?? null} onChange={(v) => setValue('payment_term_id', v)} onSearch={paymentTermsApi.search} placeholder="Pilih syarat pembayaran..." disabled={!isEditable} selectedOptions={bill?.payment_term ? [{ value: bill.payment_term.id, label: bill.payment_term.name }] : []} />
            </div>
            {(bill?.purchase_order_number || bill?.goods_receipt_number) && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <p className="text-[13px] text-[#5c9ead]">{bill.purchase_order_number ?? bill.goods_receipt_number}</p>
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
              items={lines} columns={columns}
              onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
              onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))}
              getSubtotal={lineBase} isReadOnly={!isEditable} addLabel="Tambah Item"
            />
            <FormSummary subtotal={subtotal} taxAmount={taxAmount} grandTotal={grandTotal} paidAmount={bill?.paid_amount} balanceDue={bill?.balance_due} />
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={bill?.number ?? ''} isLoading={voidBill.isPending} />
    </>
  )
}
