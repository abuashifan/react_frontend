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
import { usePurchaseRequest, usePurchaseRequestMutations } from '../hooks/usePurchaseRequestList'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { purchaseRequestSchema, type PurchaseRequestFormValues } from '../schemas/purchaseRequestSchema'
import type { DocumentStatus } from '@/types/common.types'

interface EditableLine {
  product_id: number | null
  description: string
  quantity: number
  estimated_price: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, description: '', quantity: 1, estimated_price: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.estimated_price
}

export default function PurchaseRequestFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = usePurchaseRequest(id ? Number(id) : undefined)
  const pr = data?.data
  const { create, update, submit, approve, reject, cancel } = usePurchaseRequestMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  const status = (pr?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || pr?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  useEffect(() => {
    if (pr) {
      reset({ date: pr.date, department_id: pr.department_id, notes: pr.notes ?? '' })
      setLines(pr.lines.map((l) => ({
        product_id: l.product_id,
        description: l.description,
        quantity: l.quantity,
        estimated_price: l.estimated_price,
      })))
    }
  }, [pr, reset])

  const handleSave = handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const res = await create.mutateAsync({ ...values, lines })
        toast.success('Purchase Request berhasil dibuat.')
        navigate(`/purchase/requests/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines } })
        toast.success('Purchase Request berhasil diperbarui.')
      }
    } catch { toast.error('Gagal menyimpan Purchase Request.') }
  })

  const handleSubmitPR = async () => {
    try { await submit.mutateAsync(Number(id)); toast.success('PR berhasil disubmit.') }
    catch { toast.error('Gagal submit PR.') }
  }
  const handleApprovePR = async () => {
    try { await approve.mutateAsync(Number(id)); toast.success('PR berhasil di-approve.') }
    catch { toast.error('Gagal approve PR.') }
  }
  const handleReject = async () => {
    try { await reject.mutateAsync(Number(id)); toast.success('PR ditolak.') }
    catch { toast.error('Gagal menolak PR.') }
  }
  const handleCancel = async () => {
    try { await cancel.mutateAsync(Number(id)); toast.success('PR dibatalkan.') }
    catch { toast.error('Gagal membatalkan PR.') }
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('purchase.requests.create')) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (pr?.status === 'draft' && can('purchase.requests.edit')) {
      actions.push({ id: 'submit', label: 'Submit', variant: 'primary', onClick: () => void handleSubmitPR(), isLoading: submit.isPending })
    }
    if (pr?.status === 'submitted' && can('purchase.requests.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprovePR(), isLoading: approve.isPending })
      actions.push({ id: 'reject', label: 'Tolak', variant: 'destructive', onClick: () => void handleReject(), isLoading: reject.isPending })
    }
    if (['draft', 'submitted'].includes(pr?.status ?? '') && can('purchase.requests.cancel')) {
      actions.push({ id: 'cancel', label: 'Batalkan', variant: 'destructive', onClick: () => void handleCancel(), isLoading: cancel.isPending })
    }
  }

  const columns: LineItemColumn<EditableLine>[] = [
    {
      id: 'product', header: 'Produk', width: 200,
      render: ({ item, isReadOnly, onUpdate }) => (
        <SearchableSelect value={item.product_id} onChange={(v) => onUpdate('product_id', v)} onSearch={produkApi.search} placeholder="Pilih produk..." disabled={isReadOnly} size="sm" />
      ),
    },
    {
      id: 'description', header: 'Deskripsi', width: 200,
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
      id: 'estimated_price', header: 'Est. Harga', width: 130, align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.estimated_price} onChange={(e) => onUpdate('estimated_price', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Purchase Request" breadcrumb={[{ label: 'Pembelian' }, { label: 'Purchase Request', path: '/purchase/requests' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout
      title={isCreate ? 'Buat Purchase Request' : 'Purchase Request'}
      documentNumber={pr?.number}
      status={status}
      breadcrumb={[{ label: 'Pembelian' }, { label: 'Purchase Request', path: '/purchase/requests' }, { label: isCreate ? 'Buat PR' : (pr?.number ?? '') }]}
      bottomBar={<DocumentActionBar documentStatus={status} documentNumber={pr?.number} actions={actions} />}
    >
      <div className="space-y-3">
        <FormSection title="Header">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
            <Input {...register('date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />
            {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Departemen</Label>
            <SearchableSelect
              value={watch('department_id') ?? null}
              onChange={(v) => setValue('department_id', v)}
              onSearch={departemenApi.search}
              placeholder="Pilih departemen..."
              disabled={!isEditable}
              selectedOptions={pr?.department ? [{ value: pr.department.id, label: pr.department.name }] : []}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan / Alasan</Label>
            <Textarea {...register('notes')} disabled={!isEditable} placeholder="Alasan kebutuhan..." className="resize-none text-[13px]" rows={2} />
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
