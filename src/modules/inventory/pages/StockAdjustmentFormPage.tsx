import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { useStockAdjustment, useStockAdjustmentMutations } from '../hooks/useStockAdjustmentList'
import { stockAdjustmentSchema, stockAdjustmentLineSchema, type StockAdjustmentFormValues } from '../schemas/stockAdjustmentSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { StockAdjustmentLineType } from '../types/stockAdjustment.types'
import { toDateInputValue } from '@/lib/utils'

interface EditableLine {
  product_id: number | null
  warehouse_id: number | null
  adjustment_type: StockAdjustmentLineType
  quantity: number
  unit_cost: number
  reason: string
}

interface SelectOption { value: number; label: string; sublabel?: string }

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

  const { control, getValues, register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { adjustment_date: new Date().toISOString().slice(0, 10) },
  })
  const warehouseId = useWatch({ control, name: 'warehouse_id' })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [lineErrors, setLineErrors] = useState<Record<number, Partial<Record<keyof EditableLine, string>>>>({})
  const [preloadedProducts, setPreloadedProducts] = useState<Map<number, SelectOption>>(new Map())
  const [preloadedWarehouses, setPreloadedWarehouses] = useState<Map<number, SelectOption>>(new Map())
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isApproveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [isPostConfirmOpen, setPostConfirmOpen] = useState(false)

  const status = (adj?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || adj?.status === 'draft'

  useEffect(() => {
    if (adj) {
      reset({
        adjustment_date: toDateInputValue(adj.adjustment_date),
        reason: adj.reason ?? '',
        notes: adj.notes ?? '',
        warehouse_id: adj.warehouse_id ?? null,
      })
      const timer = window.setTimeout(() => {
        setLines(adj.lines.map((l) => ({
          product_id: l.product_id,
          warehouse_id: l.warehouse_id,
          adjustment_type: l.adjustment_type,
          quantity: l.quantity,
          unit_cost: l.unit_cost ?? 0,
          reason: l.reason ?? '',
        })))

        // Build preloaded option lookups so SearchableSelect can show labels
        const productMap = new Map<number, SelectOption>()
        const warehouseMap = new Map<number, SelectOption>()
        adj.lines.forEach((l) => {
          if (l.product_id && l.product) {
            productMap.set(l.product_id, {
              value: l.product_id,
              label: (l.product as { product_name?: string }).product_name ?? String(l.product_id),
              sublabel: (l.product as { product_code?: string }).product_code,
            })
          }
          if (l.warehouse_id && l.warehouse) {
            warehouseMap.set(l.warehouse_id, {
              value: l.warehouse_id,
              label: (l.warehouse as { name?: string }).name ?? String(l.warehouse_id),
            })
          }
        })
        setPreloadedProducts(productMap)
        setPreloadedWarehouses(warehouseMap)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [adj, reset])

  const formDraft = usePersistentFormDraft<StockAdjustmentFormValues, EditableLine[]>({
    draftKey: `inventory.stock-adjustment.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [{ ...DEFAULT_LINE }]),
    enabled: isEditable,
  })

  const handleDiscardDraft = () => {
    if (adj) {
      reset({
        adjustment_date: toDateInputValue(adj.adjustment_date),
        reason: adj.reason ?? '',
        notes: adj.notes ?? '',
        warehouse_id: adj.warehouse_id ?? null,
      })
      setLines(adj.lines.map((l) => ({
        product_id: l.product_id,
        warehouse_id: l.warehouse_id,
        adjustment_type: l.adjustment_type,
        quantity: l.quantity,
        unit_cost: l.unit_cost ?? 0,
        reason: l.reason ?? '',
      })))
    } else {
      reset({ adjustment_date: new Date().toISOString().slice(0, 10) })
      setLines([{ ...DEFAULT_LINE }])
    }
    formDraft.discardDraft()
    toast.success('Draft lokal dibuang.')
  }

  const validateLines = (): boolean => {
    const errs: Record<number, Partial<Record<keyof EditableLine, string>>> = {}
    let valid = true
    lines.forEach((l, i) => {
      const result = stockAdjustmentLineSchema.safeParse(l)
      if (!result.success) {
        valid = false
        const fieldErrors: Partial<Record<keyof EditableLine, string>> = {}
        result.error.issues.forEach((e) => {
          const field = e.path[0] as keyof EditableLine
          if (!fieldErrors[field]) fieldErrors[field] = e.message
        })
        errs[i] = fieldErrors
      }
    })
    setLineErrors(errs)
    return valid
  }

  const handleSave = handleSubmit(async (values) => {
    if (lines.length === 0) { toast.error('Tambahkan minimal satu item.'); return }
    if (!validateLines()) { toast.error('Periksa kembali item yang belum lengkap.'); return }

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
        formDraft.clearDraft()
        toast.success('Penyesuaian berhasil dibuat.')
        navigate(`/inventory/adjustments/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines: linePayloads } })
        formDraft.clearDraft()
        toast.success('Penyesuaian berhasil diperbarui.')
      }
    } catch { toast.error('Gagal menyimpan penyesuaian.') }
  })

  const handleApprove = async () => {
    try { await approve.mutateAsync(Number(id)); formDraft.clearDraft(); toast.success('Penyesuaian di-approve.') }
    catch { toast.error('Gagal approve.') }
  }
  const handlePost = async () => {
    try { await post.mutateAsync(Number(id)); formDraft.clearDraft(); toast.success('Penyesuaian berhasil diposting.') }
    catch { toast.error('Gagal posting.') }
  }
  const handleVoid = async (reason: string) => {
    await voidAdj.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Penyesuaian berhasil di-void.')
    setVoidOpen(false)
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product', header: 'Produk', width: 180,
      render: ({ item, index, isReadOnly, onUpdate }) => (
        <div>
          <SearchableSelect
            value={item.product_id}
            onChange={(v) => { onUpdate('product_id', v); setLineErrors((prev) => { const n = { ...prev }; if (n[index]) { const f = { ...n[index] }; delete f.product_id; n[index] = f } return n }) }}
            onSearch={produkApi.search}
            selectedOptions={item.product_id && preloadedProducts.has(item.product_id) ? [preloadedProducts.get(item.product_id)!] : []}
            placeholder="Pilih produk..."
            disabled={isReadOnly}
            size="sm"
          />
          {lineErrors[index]?.product_id && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index].product_id}</p>}
        </div>
      ),
    },
    {
      id: 'warehouse', header: 'Gudang', width: 150,
      render: ({ item, index, isReadOnly, onUpdate }) => (
        <div>
          <SearchableSelect
            value={item.warehouse_id}
            onChange={(v) => { onUpdate('warehouse_id', v); setLineErrors((prev) => { const n = { ...prev }; if (n[index]) { const f = { ...n[index] }; delete f.warehouse_id; n[index] = f } return n }) }}
            onSearch={gudangApi.search}
            selectedOptions={item.warehouse_id && preloadedWarehouses.has(item.warehouse_id) ? [preloadedWarehouses.get(item.warehouse_id)!] : []}
            placeholder="Pilih gudang..."
            disabled={isReadOnly}
            size="sm"
          />
          {lineErrors[index]?.warehouse_id && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index].warehouse_id}</p>}
        </div>
      ),
    },
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
    {
      id: 'quantity', header: 'Qty', width: 80, align: 'right',
      render: ({ item, index, isReadOnly, onUpdate }) => (
        <div>
          <Input type="number" value={item.quantity} onChange={(e) => { onUpdate('quantity', Number(e.target.value)); setLineErrors((prev) => { const n = { ...prev }; if (n[index]) { const f = { ...n[index] }; delete f.quantity; n[index] = f } return n }) }} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
          {lineErrors[index]?.quantity && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index].quantity}</p>}
        </div>
      ),
    },
    { id: 'unit_cost', header: 'Harga', width: 110, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.unit_cost} onChange={(e) => onUpdate('unit_cost', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
    { id: 'reason', header: 'Alasan', width: 150, render: ({ item, isReadOnly, onUpdate }) => <Input value={item.reason} onChange={(e) => onUpdate('reason', e.target.value)} disabled={isReadOnly} placeholder="Alasan..." className="h-8 text-[12px]" /> },
  ]

  const actions: DocumentActionButton[] = []
  if (isEditable) {
    const savePerm = isCreate ? 'inventory.adjustments.create' : 'inventory.adjustments.edit'
    if (can(savePerm)) {
      actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
    }
  }
  if (isEditable && formDraft.isRestored) {
    actions.push({ id: 'discard_draft', label: 'Buang Draft', variant: 'neutral', onClick: handleDiscardDraft })
  }
  if (!isCreate) {
    if (adj?.status === 'draft' && can('inventory.adjustments.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => setApproveConfirmOpen(true) })
    }
    if (adj?.status === 'approved' && can('inventory.adjustments.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setPostConfirmOpen(true) })
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
        readOnly={!isEditable}
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
              <SearchableSelect value={warehouseId ?? null} onChange={(v) => setValue('warehouse_id', v)} onSearch={gudangApi.search} placeholder="Pilih gudang..." disabled={!isEditable} />
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
              onRemove={(i) => { setLines((prev) => prev.filter((_, idx) => idx !== i)); setLineErrors((prev) => { const n: typeof prev = {}; Object.keys(prev).forEach((k) => { const ki = Number(k); if (ki !== i) n[ki > i ? ki - 1 : ki] = prev[ki] }); return n }) }}
              onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))}
              isReadOnly={!isEditable} addLabel="Tambah Item"
            />
          </div>
        </div>
      </FormLayout>

      <ConfirmDialog
        isOpen={isApproveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={() => { setApproveConfirmOpen(false); void handleApprove() }}
        title="Approve Penyesuaian"
        description={`Approve penyesuaian ${adj?.number ?? ''} untuk melanjutkan ke tahap posting.`}
        confirmLabel="Approve"
        isLoading={approve.isPending}
      />

      <ConfirmDialog
        isOpen={isPostConfirmOpen}
        onClose={() => setPostConfirmOpen(false)}
        onConfirm={() => { setPostConfirmOpen(false); void handlePost() }}
        title="Posting Penyesuaian"
        description={`Posting penyesuaian ${adj?.number ?? ''} akan memperbarui saldo stok secara permanen.`}
        confirmLabel="Post"
        isLoading={post.isPending}
      />

      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={adj?.number ?? ''} isLoading={voidAdj.isPending} />
    </>
  )
}
