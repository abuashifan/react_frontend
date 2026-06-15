import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSummary } from '@/components/shared/form/FormSummary'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePurchaseReturn, usePurchaseReturnMutations } from '../hooks/usePurchaseReturnList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { purchaseReturnSchema, type PurchaseReturnFormValues } from '../schemas/purchaseReturnSchema'
import type { DocumentStatus } from '@/types/common.types'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  unit_price: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1, unit_price: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price
}

export default function PurchaseReturnFormPage() {
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [isVoidOpen, setVoidOpen] = useState(false)

  const { data, isLoading } = usePurchaseReturn(id ? Number(id) : undefined)
  const ret = data?.data
  const { create, approve, post, void: voidRet } = usePurchaseReturnMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<PurchaseReturnFormValues>({
    resolver: zodResolver(purchaseReturnSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  const status = (ret?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || ret?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  useEffect(() => {
    if (ret) {
      reset({ vendor_id: ret.vendor_id, date: ret.date, notes: ret.notes ?? '' })
      setLines(ret.lines.map((l) => ({ product_id: l.product_id, description: l.description, quantity: l.quantity, unit_price: l.unit_price })))
    }
  }, [ret, reset])

  const handleSave = handleSubmit(async (values) => {
    try {
      await create.mutateAsync({ ...values, lines })
      toast.success('Retur pembelian berhasil dibuat.')
    } catch { toast.error('Gagal menyimpan retur pembelian.') }
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); toast.success('Retur di-approve.') } catch { toast.error('Gagal approve retur.') } }
  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Retur berhasil diposting.') } catch { toast.error('Gagal posting retur.') } }
  const handleVoid = async (reason: string) => {
    await voidRet.mutateAsync({ id: Number(id), reason })
    toast.success('Retur berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('purchase.returns.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (ret?.status === 'draft' && can('purchase.returns.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (ret?.status === 'approved' && can('purchase.returns.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (ret?.status === 'posted' && can('purchase.returns.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    { id: 'product', header: 'Produk', width: 200, render: ({ item, isReadOnly, onUpdate }) => <SearchableSelect value={item.product_id} onChange={(v) => onUpdate('product_id', v)} onSearch={produkApi.search} placeholder="Pilih produk..." disabled={isReadOnly} size="sm" /> },
    { id: 'description', header: 'Deskripsi', width: 200, render: ({ item, isReadOnly, onUpdate }) => <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" /> },
    { id: 'quantity', header: 'Qty', width: 80, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
    { id: 'unit_price', header: 'Harga', width: 120, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.unit_price} onChange={(e) => onUpdate('unit_price', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Retur Pembelian" breadcrumb={[{ label: 'Pembelian' }, { label: 'Retur', path: '/purchase/returns' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Retur Pembelian' : 'Retur Pembelian'}
        documentNumber={ret?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Retur', path: '/purchase/returns' }, { label: isCreate ? 'Buat Retur' : (ret?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={ret?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('vendor_id') ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isEditable} error={errors.vendor_id?.message} selectedOptions={ret?.vendor ? [{ value: ret.vendor.id, label: ret.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>
            {(ret?.vendor_bill_number || ret?.goods_receipt_number) && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <p className="text-[13px] text-[#5c9ead]">{ret.vendor_bill_number ?? ret.goods_receipt_number}</p>
              </div>
            )}
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item</p>
            <LineItemsTable items={lines} columns={columns} onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])} onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))} onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))} getSubtotal={lineSubtotal} isReadOnly={!isEditable} addLabel="Tambah Item" />
            <FormSummary subtotal={subtotal} grandTotal={subtotal} />
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={ret?.number ?? ''} isLoading={voidRet.isPending} />
    </>
  )
}
