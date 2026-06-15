import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { useStockAdjustment, useStockAdjustmentMutations } from '../hooks/useStockAdjustmentList'
import { stockAdjustmentSchema, type StockAdjustmentFormValues } from '../schemas/stockAdjustmentSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { StockAdjustmentLineType } from '../types/stockAdjustment.types'

interface EditableLine {
  product_id: number | null
  warehouse_id: number | null
  adjustment_type: StockAdjustmentLineType
  quantity: number
  unit_cost: number
  reason: string
}

const DEFAULT_LINE: EditableLine = { product_id: null, warehouse_id: null, adjustment_type: 'increase', quantity: 1, unit_cost: 0, reason: '' }

export default function StockAdjustmentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useStockAdjustment(id ? Number(id) : undefined)
  const adj = data?.data
  const { create, update, approve, post, void: voidAdj } = useStockAdjustmentMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { adjustment_date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [isVoidOpen, setVoidOpen] = useState(false)

  const status = (adj?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || adj?.status === 'draft'

  useEffect(() => {
    if (adj) {
      reset({ adjustment_date: adj.adjustment_date, reason: adj.reason ?? '', notes: adj.notes ?? '', warehouse_id: adj.warehouse_id ?? null })
      setLines(adj.lines.map((l) => ({
        product_id: l.product_id,
        warehouse_id: l.warehouse_id,
        adjustment_type: l.adjustment_type,
        quantity: l.quantity,
        unit_cost: l.unit_cost ?? 0,
        reason: l.reason ?? '',
      })))
    }
  }, [adj, reset])

  const handleSave = handleSubmit(async (values) => {
    const linePayloads = lines.map((l) => ({
      product_id: l.product_id!,
      warehouse_id: l.warehouse_id!,
      adjustment_type: l.adjustment_type,
      quantity: l.quantity,
      unit_cost: l.unit_cost || null,
      reason: l.reason || null,
    }))
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines: linePayloads })
        toast.success('Penyesuaian berhasil dibuat.')
        navigate(`/inventory/adjustments/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines: linePayloads } })
        toast.success('Penyesuaian berhasil diperbarui.')
      }
    } catch { toast.error('Gagal menyimpan penyesuaian.') }
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); toast.success('Penyesuaian di-approve.') } catch { toast.error('Gagal approve.') } }
  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Penyesuaian berhasil diposting.') } catch { toast.error('Gagal posting.') } }
  const handleVoid = async (reason: string) => {
    await voidAdj.mutateAsync({ id: Number(id), reason })
    toast.success('Penyesuaian berhasil di-void.')
    setVoidOpen(false)
  }

  const columns: LineItemColumn<EditableLine>[] = [
    { id: 'product', header: 'Produk', width: 180, render: ({ item, isReadOnly, onUpdate }) => <SearchableSelect value={item.product_id} onChange={(v) => onUpdate('product_id', v)} onSearch={produkApi.search} placeholder="Pilih produk..." disabled={isReadOnly} size="sm" /> },
    { id: 'warehouse', header: 'Gudang', width: 150, render: ({ item, isReadOnly, onUpdate }) => <SearchableSelect value={item.warehouse_id} onChange={(v) => onUpdate('warehouse_id', v)} onSearch={gudangApi.search} placeholder="Pilih gudang..." disabled={isReadOnly} size="sm" /> },
    {
      id: 'adj_type', header: 'Tipe', width: 100,
      render: ({ item, isReadOnly, onUpdate }) => (
        <Select value={item.adjustment_type} onValueChange={(v) => onUpdate('adjustment_type', v as StockAdjustmentLineType)} disabled={isReadOnly}>
          <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="increase">Tambah</SelectItem>
            <SelectItem value="decrease">Kurang</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    { id: 'quantity', header: 'Qty', width: 80, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
    { id: 'unit_cost', header: 'Harga', width: 110, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.unit_cost} onChange={(e) => onUpdate('unit_cost', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
    { id: 'reason', header: 'Alasan', width: 150, render: ({ item, isReadOnly, onUpdate }) => <Input value={item.reason} onChange={(e) => onUpdate('reason', e.target.value)} disabled={isReadOnly} placeholder="Alasan..." className="h-8 text-[12px]" /> },
  ]

  const actions: DocumentActionButton[] = []
  if (isEditable && can('inventory.adjustments.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (adj?.status === 'draft' && can('inventory.adjustments.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (adj?.status === 'approved' && can('inventory.adjustments.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (['draft', 'approved', 'posted'].includes(adj?.status ?? '') && can('inventory.adjustments.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Penyesuaian Stok" breadcrumb={[{ label: 'Inventori' }, { label: 'Penyesuaian', path: '/inventory/adjustments' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Penyesuaian Stok' : 'Penyesuaian Stok'}
        documentNumber={adj?.number}
        status={status}
        breadcrumb={[{ label: 'Inventori' }, { label: 'Penyesuaian', path: '/inventory/adjustments' }, { label: isCreate ? 'Buat Penyesuaian' : (adj?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={adj?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('adjustment_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.adjustment_date && <p className="text-[11px] text-red-500">{errors.adjustment_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang Default</Label>
              <SearchableSelect value={watch('warehouse_id') ?? null} onChange={(v) => setValue('warehouse_id', v)} onSearch={gudangApi.search} placeholder="Pilih gudang..." disabled={!isEditable} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alasan</Label>
              <Input {...register('reason')} disabled={!isEditable} placeholder="Alasan penyesuaian..." className="h-9 text-[13px]" />
            </div>
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
              isReadOnly={!isEditable} addLabel="Tambah Item"
            />
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={adj?.number ?? ''} isLoading={voidAdj.isPending} />
    </>
  )
}
