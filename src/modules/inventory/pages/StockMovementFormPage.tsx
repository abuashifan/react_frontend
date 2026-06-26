import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
import { useStockMovement, useStockMovementMutations } from '../hooks/useStockMovementList'
import { stockMovementSchema, stockMovementLineSchema, type StockMovementFormValues } from '../schemas/stockMovementSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { StockMovementType } from '../types/stockMovement.types'
import { toDateInputValue } from '@/lib/utils'

const MANUAL_TYPES: { value: StockMovementType; label: string }[] = [
  { value: 'adjustment_in', label: 'Penyesuaian Masuk' },
  { value: 'adjustment_out', label: 'Penyesuaian Keluar' },
  { value: 'opening_stock', label: 'Stok Awal' },
]

interface EditableLine {
  product_id: number | null
  warehouse_id: number | null
  quantity: number
  unit_cost: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, warehouse_id: null, quantity: 1, unit_cost: 0 }

export default function StockMovementFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useStockMovement(id ? Number(id) : undefined)
  const movement = data?.data
  const { create, post, void: voidMovement } = useStockMovementMutations()

  const { register, handleSubmit, setValue, watch, getValues, control, reset, formState: { errors, isSubmitting } } = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { movement_date: new Date().toISOString().slice(0, 10), movement_type: 'adjustment_in' },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [lineErrors, setLineErrors] = useState<Record<number, Partial<Record<keyof EditableLine, string>>>>({})
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isPostConfirmOpen, setPostConfirmOpen] = useState(false)

  // Existing movement drafts are read-only — backend has no update endpoint for movements.
  const status = (movement?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate

  useEffect(() => {
    if (movement) {
      reset({
        movement_date: toDateInputValue(movement.movement_date),
        movement_type: movement.movement_type,
        description: movement.description ?? '',
        notes: movement.notes ?? '',
      })
      setLines(movement.lines.map((l) => ({
        product_id: l.product_id,
        warehouse_id: l.warehouse_id,
        quantity: l.quantity,
        unit_cost: l.unit_cost ?? 0,
      })))
    }
  }, [movement, reset])

  const formDraft = usePersistentFormDraft<StockMovementFormValues, EditableLine[]>({
    draftKey: 'inventory.stock-movement.new',
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [{ ...DEFAULT_LINE }]),
    enabled: isCreate,
  })

  const validateLines = (): boolean => {
    const errors: Record<number, Partial<Record<keyof EditableLine, string>>> = {}
    let valid = true
    lines.forEach((l, i) => {
      const result = stockMovementLineSchema.safeParse(l)
      if (!result.success) {
        valid = false
        const fieldErrors: Partial<Record<keyof EditableLine, string>> = {}
        result.error.issues.forEach((e) => {
          const field = e.path[0] as keyof EditableLine
          if (!fieldErrors[field]) fieldErrors[field] = e.message
        })
        errors[i] = fieldErrors
      }
    })
    setLineErrors(errors)
    return valid
  }

  const handleSave = handleSubmit(async (values) => {
    if (lines.length === 0) { toast.error('Tambahkan minimal satu item.'); return }
    if (!validateLines()) { toast.error('Periksa kembali item yang belum lengkap.'); return }

    try {
      const linePayloads = lines.map((l) => ({
        product_id: l.product_id!,
        warehouse_id: l.warehouse_id!,
        quantity: l.quantity,
        unit_cost: l.unit_cost || null,
      }))
      const res = await create.mutateAsync({ ...values, movement_type: values.movement_type as StockMovementType, lines: linePayloads })
      formDraft.clearDraft()
      toast.success('Mutasi stok berhasil dibuat.')
      navigate(`/inventory/movements/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan mutasi stok.') }
  })

  const handlePost = async () => {
    try { await post.mutateAsync(Number(id)); toast.success('Mutasi berhasil diposting.') }
    catch { toast.error('Gagal posting mutasi.') }
  }

  const handleVoid = async (reason: string) => {
    await voidMovement.mutateAsync({ id: Number(id), reason })
    toast.success('Mutasi berhasil di-void.')
    setVoidOpen(false)
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product',
      header: 'Produk',
      width: 200,
      render: ({ item, index, isReadOnly, onUpdate }) => (
        <div>
          <SearchableSelect value={item.product_id} onChange={(v) => { onUpdate('product_id', v); setLineErrors((prev) => { const n = { ...prev }; delete n[index]; return n }) }} onSearch={produkApi.search} placeholder="Pilih produk..." disabled={isReadOnly} size="sm" />
          {lineErrors[index]?.product_id && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index].product_id}</p>}
        </div>
      ),
    },
    {
      id: 'warehouse',
      header: 'Gudang',
      width: 160,
      render: ({ item, index, isReadOnly, onUpdate }) => (
        <div>
          <SearchableSelect value={item.warehouse_id} onChange={(v) => { onUpdate('warehouse_id', v); setLineErrors((prev) => { const n = { ...prev }; delete n[index]; return n }) }} onSearch={gudangApi.search} placeholder="Pilih gudang..." disabled={isReadOnly} size="sm" />
          {lineErrors[index]?.warehouse_id && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index].warehouse_id}</p>}
        </div>
      ),
    },
    {
      id: 'quantity',
      header: 'Qty',
      width: 90,
      align: 'right',
      render: ({ item, index, isReadOnly, onUpdate }) => (
        <div>
          <Input type="number" value={item.quantity} onChange={(e) => { onUpdate('quantity', Number(e.target.value)); setLineErrors((prev) => { const n = { ...prev }; if (n[index]) { const f = { ...n[index] }; delete f.quantity; n[index] = f } return n }) }} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} step="any" />
          {lineErrors[index]?.quantity && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index].quantity}</p>}
        </div>
      ),
    },
    { id: 'unit_cost', header: 'Harga Satuan', width: 120, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.unit_cost} onChange={(e) => onUpdate('unit_cost', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
  ]

  const actions: DocumentActionButton[] = []
  if (isCreate && can('inventory.movements.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (isCreate && formDraft.isRestored) {
    actions.push({ id: 'discard_draft', label: 'Buang Draft', variant: 'neutral', onClick: () => { reset({ movement_date: new Date().toISOString().slice(0, 10), movement_type: 'adjustment_in' }); setLines([{ ...DEFAULT_LINE }]); formDraft.discardDraft(); toast.success('Draft lokal dibuang.') } })
  }
  if (!isCreate) {
    if (movement?.status === 'draft' && can('inventory.movements.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setPostConfirmOpen(true) })
    }
    if (movement?.status === 'posted' && can('inventory.movements.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Mutasi Stok" breadcrumb={[{ label: 'Inventori' }, { label: 'Mutasi Stok', path: '/inventory/movements' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Mutasi Stok' : 'Mutasi Stok'}
        documentNumber={movement?.number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[{ label: 'Inventori' }, { label: 'Mutasi Stok', path: '/inventory/movements' }, { label: isCreate ? 'Buat Mutasi' : (movement?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={movement?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('movement_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.movement_date && <p className="text-[11px] text-red-500">{errors.movement_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tipe <span className="text-red-500">*</span></Label>
              <Select value={watch('movement_type')} onValueChange={(v) => setValue('movement_type', v as StockMovementType)} disabled={!isCreate}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Pilih tipe..." />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</Label>
              <Input {...register('description')} disabled={!isEditable} placeholder="Deskripsi..." className="h-9 text-[13px]" />
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
        isOpen={isPostConfirmOpen}
        onClose={() => setPostConfirmOpen(false)}
        onConfirm={() => { setPostConfirmOpen(false); void handlePost() }}
        title="Posting Mutasi Stok"
        description={`Posting mutasi ${movement?.number ?? ''} akan memperbarui saldo stok secara permanen.`}
        confirmLabel="Post"
        isLoading={post.isPending}
      />

      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={movement?.number ?? ''} isLoading={voidMovement.isPending} />
    </>
  )
}
