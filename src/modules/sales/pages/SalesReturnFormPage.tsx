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
import { FieldError } from '@/components/shared/form/FieldError'
import { applyApiValidationErrors, getApiErrorMessage, getApiLineErrors, type LineItemErrorMap } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useSalesReturn, useSalesReturnMutations } from '../hooks/useSalesReturnList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { salesReturnSchema, type SalesReturnFormValues } from '../schemas/salesReturnSchema'
import type { DocumentStatus } from '@/types/common.types'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'

interface EditableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  description: string
  quantity: number
  unit_price: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, product: null, description: '', quantity: 1, unit_price: 0 }

function lineSubtotal(l: EditableLine) {
  return l.quantity * l.unit_price
}

export default function SalesReturnFormPage() {
  const { id } = useParams()
  // `/sales/returns/create` dan `/sales/returns/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <SalesReturnFormPageContent key={id ?? 'create'} />
}

function SalesReturnFormPageContent() {
  const { replaceRecordTab } = useRecordTab()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useSalesReturn(id ? Number(id) : undefined)
  const ret = data?.data
  const { create, update, approve, post, void: voidRet } = useSalesReturnMutations()

  const { register, handleSubmit, control, getValues, setValue, setError, watch, reset, formState: { errors, isSubmitting } } = useForm<SalesReturnFormValues>({
    resolver: zodResolver(salesReturnSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])

  // Error per baris dari backend (mis. lines.0.quantity) supaya baris yang

  // ditolak ikut ditandai, bukan cuma toast.

  const [lineErrors, setLineErrors] = useState<LineItemErrorMap>({})
  const [isVoidOpen, setVoidOpen] = useState(false)

  const status = (ret?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || ret?.status === 'draft'
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)

  useEffect(() => {
    if (ret) {
      reset({
        customer_id: ret.customer_id,
        date: ret.date,
        notes: ret.notes ?? '',
      })
      setLines(ret.lines.map((l) => ({
        product_id: l.product_id,
        product: l.product,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
      })))
    }
  }, [ret, reset])


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<SalesReturnFormValues, EditableLine[]>({
    draftKey: `sales.return.${id ?? 'new'}`,
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
        toast.success('Retur berhasil disimpan.')
        replaceRecordTab('/sales/returns/create', {
          label: res.data.number,
          path: `/sales/returns/${res.data.id}`,
        })
      } else {
        await update.mutateAsync({ id: Number(id), payload: { ...values, lines } })
        formDraft.clearDraft()
        toast.success('Retur berhasil diperbarui.')
      }
    } catch (saveError) {
      // Backend memvalidasi tanggal sebagai `return_date`, form memakai `date`.
      setLineErrors(getApiLineErrors(saveError))
      applyApiValidationErrors(saveError, setError, { return_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan retur.'))
    }
  })

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Retur berhasil di-approve.')
    } catch (approveError) { toast.error(getApiErrorMessage(approveError, 'Gagal approve retur.')) }
  }

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      formDraft.clearDraft()
      toast.success('Retur berhasil diposting.')
    } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal memposting retur.')) }
  }

  const handleVoid = async (reason: string) => {
    await voidRet.mutateAsync({ id: Number(id), reason })
    formDraft.clearDraft()
    toast.success('Retur berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isEditable && can('sales.returns.create')) {
    actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSaveDraft(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (ret?.status === 'draft' && can('sales.returns.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => void handleApprove(), isLoading: approve.isPending })
    }
    if (ret?.status === 'approved' && can('sales.returns.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (ret?.status === 'posted' && can('sales.returns.void')) {
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
      width: 200,
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
    {
      id: 'unit_price',
      header: 'Harga',
      width: 120,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) => (
        <Input type="number" value={item.unit_price} onChange={(e) => onUpdate('unit_price', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
      ),
    },
  ]

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Retur Penjualan" breadcrumb={[{ label: 'Sales' }, { label: 'Retur', path: '/sales/returns' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Retur Penjualan' : 'Retur Penjualan'}
        documentNumber={ret?.number}
        status={status}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Retur', path: '/sales/returns' },
          { label: isCreate ? 'Buat Retur' : (ret?.number ?? '') },
        ]}
        headerActions={<DocumentActionBar placement="header" documentStatus={status} documentNumber={ret?.number} actions={actions} />}
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
                selectedOptions={ret?.customer ? [{ value: ret.customer.id, label: ret.customer.name }] : []}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <Input {...register('date')} type="date" disabled={!isEditable} className={cn('h-9 text-[13px]', fieldErrorClass(errors.date))} />
              <FieldError message={errors.date?.message} />
            </div>

            {(ret?.sales_invoice_number || ret?.delivery_order_number) && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <p className="text-[13px] font-medium text-[#5c9ead]">
                  {ret.sales_invoice_number ?? ret.delivery_order_number}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className={cn('resize-none text-[13px]', fieldErrorClass(errors.notes))} rows={2} />
              <FieldError message={errors.notes?.message} />
            </div>
          </FormSection>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item Retur</p>
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

      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={ret?.number ?? ''}
        isLoading={voidRet.isPending}
      />
    </>
  )
}
