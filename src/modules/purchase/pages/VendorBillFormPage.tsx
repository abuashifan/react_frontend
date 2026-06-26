import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSummary } from '@/components/shared/form/FormSummary'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { DocumentLockedBanner } from '@/components/shared/document/DocumentLockedBanner'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useVendorBill, useVendorBillMutations } from '../hooks/useVendorBillList'
import { toVendorBillPayload } from '../services/vendorBillAdapter'
import { vendorBillSourceApi, type BillSourceType } from '../services/vendorBillSourceApi'
import { vendorDepositApi } from '../services/vendorDepositApi'
import { Button } from '@/components/ui/button'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { produkApi } from '@/modules/master-data/services/produkApi'
import { paymentTermsApi } from '@/modules/master-data/services/paymentTermsApi'
import { fixedAssetCategoryApi } from '@/modules/fixed-assets/services/fixedAssetCategoryApi'
import { vendorBillSchema, validateVendorBillLines, type VendorBillFormValues, type VendorBillLineErrors } from '../schemas/vendorBillSchema'
import type { DocumentStatus } from '@/types/common.types'
import { toDateInputValue, formatCurrency } from '@/lib/utils'
import type { VendorBillLineClassification } from '../types/vendorBill.types'
import { applyApiValidationErrors, getApiErrorMessage, isApiNotFound } from '@/lib/apiError'
import { NotFoundPage, ServerErrorPage } from '@/modules/errors/ErrorPage'

interface EditableLine {
  product_id: number | null
  product?: { id: number; code: string; name: string } | null
  line_classification: VendorBillLineClassification
  fixed_asset_category_id: number | null
  fixed_asset_category?: { id: number; name: string; code: string } | null
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  tax_percent: number
}

const DEFAULT_LINE: EditableLine = { product_id: null, product: null, line_classification: 'inventory', fixed_asset_category_id: null, fixed_asset_category: null, description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 }

function lineBase(l: EditableLine) {
  return l.quantity * l.unit_price * (1 - l.discount_percent / 100)
}

export default function VendorBillFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading, isError, error } = useVendorBill(id ? Number(id) : undefined)
  const bill = data?.data
  const { create, createFromPurchaseOrder, createFromGoodsReceipt, update, approve, post, void: voidBill } = useVendorBillMutations()

  // Source picker (A13-165) — hanya saat create.
  const [sourceMode, setSourceMode] = useState<'none' | BillSourceType>('none')
  const [sourceId, setSourceId] = useState<number | null>(null)
  const isSourceMode = isCreate && sourceMode !== 'none'

  const { data: sourcePreview, isFetching: isPreviewLoading } = useQuery({
    queryKey: ['vendor-bill-source', sourceMode, sourceId],
    queryFn: () => vendorBillSourceApi.preview(sourceMode as BillSourceType, sourceId as number),
    enabled: isSourceMode && !!sourceId,
  })

  const handleConvertFromSource = async () => {
    if (!sourceId) return
    try {
      const res = sourceMode === 'purchase_order'
        ? await createFromPurchaseOrder.mutateAsync(sourceId)
        : await createFromGoodsReceipt.mutateAsync(sourceId)
      toast.success('Tagihan dibuat dari dokumen sumber.')
      navigate(`/purchase/bills/${res.data.id}`)
    } catch {
      toast.error('Gagal membuat tagihan dari dokumen sumber.')
    }
  }
  const isConverting = createFromPurchaseOrder.isPending || createFromGoodsReceipt.isPending

  const { control, getValues, register, handleSubmit, setValue, reset, setError, formState: { errors, isSubmitting } } = useForm<VendorBillFormValues>({
    resolver: zodResolver(vendorBillSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), applied_vendor_deposit_amount: 0 },
  })
  const vendorId = useWatch({ control, name: 'vendor_id' })
  const paymentTermId = useWatch({ control, name: 'payment_term_id' })
  const appliedVendorDepositAmount = useWatch({ control, name: 'applied_vendor_deposit_amount' })

  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [lineErrors, setLineErrors] = useState<VendorBillLineErrors>({})
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'post' | null>(null)

  const depositVendorId = bill?.vendor_id ?? vendorId ?? null
  const { data: depositSummary, isLoading: isDepositSummaryLoading } = useQuery({
    queryKey: ['purchase', 'vendor-deposits', 'available', depositVendorId, bill?.purchase_order_id ?? null, bill?.id ?? null],
    queryFn: () => vendorDepositApi.available({ vendor_id: Number(depositVendorId), purchase_order_id: bill?.purchase_order_id ?? null, vendor_bill_id: bill?.id ?? null }),
    enabled: depositVendorId != null,
  })

  const status = (bill?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate || bill?.status === 'draft'
  const hasPaidDependences = ['partially_paid', 'paid'].includes(bill?.status ?? '')

  const subtotal = lines.reduce((s, l) => s + lineBase(l), 0)
  const taxAmount = lines.reduce((s, l) => s + lineBase(l) * (l.tax_percent / 100), 0)
  const grandTotal = subtotal + taxAmount

  useEffect(() => {
    if (bill) {
      reset({
        vendor_id: bill.vendor_id,
        date: toDateInputValue(bill.date),
        due_date: toDateInputValue(bill.due_date),
        payment_term_id: bill.payment_term_id,
        applied_vendor_deposit_amount: bill.applied_vendor_deposit_amount ?? 0,
        notes: bill.notes ?? '',
      })
      const timer = window.setTimeout(() => {
        setLines(bill.lines.map((l) => ({
          product_id: l.product_id,
          product: l.product ?? null,
          line_classification: l.line_classification ?? 'inventory',
          fixed_asset_category_id: l.fixed_asset_category_id ?? null,
          fixed_asset_category: l.fixed_asset_category ?? null,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount_percent: l.discount_percent,
          tax_percent: l.tax_percent,
        })))
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [bill, reset])

  const formDraft = usePersistentFormDraft<VendorBillFormValues, EditableLine[]>({
    draftKey: `purchase.bill.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: lines,
    onRestoreExtra: (draftLines) => setLines(draftLines.length > 0 ? draftLines : [{ ...DEFAULT_LINE }]),
    enabled: isEditable,
  })

  const handleDiscardDraft = () => {
    if (bill) {
      reset({
        vendor_id: bill.vendor_id,
        date: toDateInputValue(bill.date),
        due_date: toDateInputValue(bill.due_date),
        payment_term_id: bill.payment_term_id,
        applied_vendor_deposit_amount: bill.applied_vendor_deposit_amount ?? 0,
        notes: bill.notes ?? '',
      })
      setLines(bill.lines.map((l) => ({
        product_id: l.product_id,
        product: l.product ?? null,
        line_classification: l.line_classification ?? 'inventory',
        fixed_asset_category_id: l.fixed_asset_category_id ?? null,
        fixed_asset_category: l.fixed_asset_category ?? null,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
        tax_percent: l.tax_percent,
      })))
    } else {
      reset({ date: new Date().toISOString().slice(0, 10), applied_vendor_deposit_amount: 0 })
      setLines([{ ...DEFAULT_LINE }])
    }
    formDraft.discardDraft()
    toast.success('Draft lokal dibuang.')
  }

  const handleSave = handleSubmit(async (values) => {
    if (lines.length === 0) {
      toast.error('Tambahkan minimal satu item.')
      return
    }
    const lineValidation = validateVendorBillLines(lines)
    if (Object.keys(lineValidation).length > 0) {
      setLineErrors(lineValidation)
      toast.error('Periksa item: ada baris yang belum valid.')
      return
    }
    setLineErrors({})
    const payload = toVendorBillPayload(values, lines)
    try {
      if (isCreate) {
        const res = await create.mutateAsync(payload)
        formDraft.clearDraft()
        toast.success('Tagihan vendor berhasil dibuat.')
        navigate(`/purchase/bills/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload })
        formDraft.clearDraft()
        toast.success('Tagihan vendor berhasil diperbarui.')
      }
    } catch (saveError) {
      applyApiValidationErrors(saveError, setError, { bill_date: 'date' })
      toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan tagihan vendor.'))
    }
  })

  const handleApprove = async () => { try { await approve.mutateAsync(Number(id)); formDraft.clearDraft(); toast.success('Bill di-approve.') } catch (approveError) { toast.error(getApiErrorMessage(approveError, 'Gagal approve bill.')) } finally { setConfirmAction(null) } }
  const handlePost = async () => { try { await post.mutateAsync(Number(id)); formDraft.clearDraft(); toast.success('Bill berhasil diposting.') } catch (postError) { toast.error(getApiErrorMessage(postError, 'Gagal posting bill.')) } finally { setConfirmAction(null) } }
  const handleVoid = async (reason: string) => {
    try {
      await voidBill.mutateAsync({ id: Number(id), reason })
      formDraft.clearDraft()
      toast.success('Bill berhasil di-void.')
      setVoidOpen(false)
    } catch (voidError) {
      toast.error(getApiErrorMessage(voidError, 'Gagal void bill.'))
    }
  }

  const actions: DocumentActionButton[] = []
  const canSaveBill = isCreate ? can('purchase.bills.create') : can('purchase.bills.edit')

  if (isEditable && canSaveBill) {
    actions.push({ id: 'save', label: 'Simpan Draft', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (isEditable && formDraft.isRestored) {
    actions.push({ id: 'discard_draft', label: 'Buang Draft', variant: 'neutral', onClick: handleDiscardDraft })
  }
  if (!isCreate) {
    if (bill?.status === 'draft' && can('purchase.bills.approve')) {
      actions.push({ id: 'approve', label: 'Approve', variant: 'primary', onClick: () => setConfirmAction('approve'), isLoading: approve.isPending })
    }
    if (bill?.status === 'approved' && can('purchase.bills.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setConfirmAction('post'), isLoading: post.isPending })
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
      render: ({ item, index, isReadOnly, onUpdate }) =>
        item.line_classification === 'fixed_asset' ? (
          <SearchableSelect
            value={item.fixed_asset_category_id}
            onChange={(v) => onUpdate('fixed_asset_category_id', v)}
            onSearch={fixedAssetCategoryApi.search}
            placeholder="Pilih kategori aset..."
            disabled={isReadOnly}
            size="sm"
            selectedOptions={item.fixed_asset_category ? [{ value: item.fixed_asset_category.id, label: item.fixed_asset_category.name, sublabel: item.fixed_asset_category.code }] : []}
            error={lineErrors[index]?.product}
          />
        ) : (
          <SearchableSelect
            value={item.product_id}
            onChange={(v) => onUpdate('product_id', v)}
            onSearch={produkApi.search}
            placeholder="Pilih produk..."
            disabled={isReadOnly}
            size="sm"
            selectedOptions={item.product ? [{ value: item.product.id, label: item.product.name, sublabel: item.product.code }] : []}
            error={lineErrors[index]?.product}
          />
        ),
    },
    { id: 'description', header: 'Deskripsi', width: 150, render: ({ item, index, isReadOnly, onUpdate }) => (
      <div>
        <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Deskripsi..." className="h-8 text-[12px]" />
        {lineErrors[index]?.description && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index]?.description}</p>}
      </div>
    ) },
    { id: 'quantity', header: 'Qty', width: 70, align: 'right', render: ({ item, index, isReadOnly, onUpdate }) => (
      <div>
        <Input type="number" value={item.quantity} onChange={(e) => onUpdate('quantity', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} />
        {lineErrors[index]?.quantity && <p className="mt-0.5 text-[10px] text-red-500">{lineErrors[index]?.quantity}</p>}
      </div>
    ) },
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

  if (!isCreate && isError && isApiNotFound(error)) {
    return <NotFoundPage />
  }

  if (!isCreate && isError) {
    return <ServerErrorPage />
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Tagihan Vendor' : 'Tagihan Vendor'}
        documentNumber={bill?.number}
        status={status}
        readOnly={!isEditable}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Tagihan', path: '/purchase/bills' }, { label: isCreate ? 'Buat Bill' : (bill?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={bill?.number} actions={actions} />}
      >
        <div className="space-y-3">
          {hasPaidDependences && (
            <DocumentLockedBanner
              dependences={[{ type: 'Pembayaran', number: 'Lihat pembayaran terkait', status: 'posted', path: `/purchase/payments?bill_id=${id}` }]}
            />
          )}
          {isCreate && (
            <FormSection title="Sumber Dokumen">
              <div className="flex flex-col gap-2 md:col-span-2">
                <div className="flex gap-1">
                  {([['none', 'Tanpa Sumber'], ['purchase_order', 'Dari Purchase Order'], ['goods_receipt', 'Dari Goods Receipt']] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setSourceMode(mode); setSourceId(null) }}
                      className={`h-8 rounded px-3 text-[12px] font-medium transition-colors ${sourceMode === mode ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {isSourceMode && (
                  <>
                    <SearchableSelect
                      value={sourceId}
                      onChange={(v) => setSourceId(v)}
                      onSearch={(q) => vendorBillSourceApi.search(sourceMode as BillSourceType, q)}
                      placeholder={sourceMode === 'purchase_order' ? 'Pilih purchase order...' : 'Pilih goods receipt...'}
                    />
                    {sourceId && (
                      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
                        {isPreviewLoading ? (
                          <p className="text-[#64748b]">Memuat sisa qty...</p>
                        ) : !sourcePreview ? null : sourcePreview.hasRemaining ? (
                          <table className="w-full">
                            <thead>
                              <tr className="text-[11px] uppercase tracking-wide text-[#94a3b8]">
                                <th className="pb-1 text-left font-semibold">Item</th>
                                <th className="pb-1 text-right font-semibold">Sisa Qty</th>
                                <th className="pb-1 text-right font-semibold">Harga</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sourcePreview.lines.map((line) => (
                                <tr key={line.id} className="border-t border-[#e2e8f0]">
                                  <td className="py-1 text-[#24323a]">{line.label}</td>
                                  <td className="py-1 text-right tabular-nums">{line.remaining}</td>
                                  <td className="py-1 text-right tabular-nums">{line.unitPrice != null ? formatCurrency(line.unitPrice) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-[#b45309]">Tidak ada qty tersisa untuk ditagih dari dokumen ini.</p>
                        )}
                      </div>
                    )}
                    <div>
                      <Button
                        type="button"
                        className="h-8 bg-[#5c9ead] px-3 text-[13px] hover:bg-[#4a8593]"
                        disabled={!sourcePreview?.hasRemaining || isConverting}
                        onClick={() => void handleConvertFromSource()}
                      >
                        {isConverting ? 'Memproses...' : 'Buat Tagihan dari Sumber'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </FormSection>
          )}
          {!isSourceMode && (
          <>
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={vendorId ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isEditable} error={errors.vendor_id?.message} selectedOptions={bill?.vendor ? [{ value: bill.vendor.id, label: bill.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="date" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} id="date" type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="due_date" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jatuh Tempo</Label>
              <Input {...register('due_date')} id="due_date" type="date" disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.due_date && <p className="text-[11px] text-red-500">{errors.due_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Syarat Pembayaran</Label>
              <SearchableSelect value={paymentTermId ?? null} onChange={(v) => setValue('payment_term_id', v)} onSearch={paymentTermsApi.search} placeholder="Pilih syarat pembayaran..." disabled={!isEditable} selectedOptions={bill?.payment_term ? [{ value: bill.payment_term.id, label: bill.payment_term.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="applied_vendor_deposit_amount" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deposit Vendor Terpakai</Label>
              <Input {...register('applied_vendor_deposit_amount', { valueAsNumber: true })} id="applied_vendor_deposit_amount" type="number" min={0} disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.applied_vendor_deposit_amount && <p className="text-[11px] text-red-500">{errors.applied_vendor_deposit_amount.message}</p>}
            </div>
            {(bill?.purchase_order_number || bill?.goods_receipt_number) && (
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dokumen Sumber</Label>
                <p className="text-[13px] text-[#5c9ead]">{bill.purchase_order_number ?? bill.goods_receipt_number}</p>
              </div>
            )}
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label htmlFor="notes" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} id="notes" disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
            <div className="md:col-span-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px] text-[#334155]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#24323a]">Deposit vendor tersedia</p>
                  <p className="text-[#64748b]">{isDepositSummaryLoading ? 'Memuat summary...' : `Total belum terpakai: ${formatCurrency(depositSummary?.data.unapplied_total ?? 0)}${appliedVendorDepositAmount ? ` · Dipakai: ${formatCurrency(appliedVendorDepositAmount)}` : ''}`}</p>
                </div>
                {depositSummary?.data.deposits?.length ? <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-[#64748b]">{depositSummary.data.deposits.length} deposit</span> : null}
              </div>
              {depositSummary?.data.deposits?.length ? (
                <div className="mt-3 max-h-40 overflow-auto rounded border border-[#e2e8f0] bg-white">
                  <table className="w-full text-[12px]">
                    <thead className="bg-[#f8fafc] text-[#64748b]">
                      <tr>
                        <th className="px-2 py-1 text-left font-semibold">Nomor</th>
                        <th className="px-2 py-1 text-right font-semibold">Sisa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depositSummary.data.deposits.map((deposit) => (
                        <tr key={deposit.id} className="border-t border-[#eef2f7]">
                          <td className="px-2 py-1">{deposit.deposit_number}</td>
                          <td className="px-2 py-1 text-right tabular-nums">{formatCurrency(deposit.remaining_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-[#94a3b8]">Belum ada deposit vendor yang dapat diaplikasikan.</p>
              )}
            </div>
          </FormSection>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Item</p>
            <LineItemsTable
              items={lines} columns={columns}
              onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])}
              onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) => {
                setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
                setLineErrors((prev) => {
                  if (!prev[i]) return prev
                  const next = { ...prev }
                  delete next[i]
                  return next
                })
              }}
              getSubtotal={lineBase} isReadOnly={!isEditable} addLabel="Tambah Item"
            />
            <FormSummary subtotal={subtotal} taxAmount={taxAmount} grandTotal={grandTotal} paidAmount={bill?.paid_amount} balanceDue={bill?.balance_due} />
          </div>
          </>
          )}
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={bill?.number ?? ''} isLoading={voidBill.isPending} />
      <ConfirmDialog
        isOpen={confirmAction === 'approve'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void handleApprove()}
        title="Approve Tagihan"
        description={<>Setujui tagihan {bill?.number ?? ''}? Tagihan akan masuk tahap siap-posting dan tidak dapat diedit lagi.</>}
        confirmLabel="Approve"
        loadingLabel="Memproses..."
        isLoading={approve.isPending}
      />
      <ConfirmDialog
        isOpen={confirmAction === 'post'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void handlePost()}
        title="Posting Tagihan"
        description={<>Posting tagihan {bill?.number ?? ''}? Jurnal Hutang Usaha (AP) akan dibuat dan saldo hutang vendor bertambah. Pembatalan hanya bisa lewat void.</>}
        confirmLabel="Post"
        loadingLabel="Memposting..."
        isLoading={post.isPending}
      />
    </>
  )
}
