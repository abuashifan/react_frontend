import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useVendorDeposit, useVendorDepositMutations } from '../hooks/useVendorDepositList'
import { useVendorOpenBills } from '../hooks/useVendorPaymentList'
import { getApiErrorMessage } from '@/lib/apiError'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { vendorDepositSchema, type VendorDepositFormValues } from '../schemas/vendorDepositSchema'
import type { DocumentStatus } from '@/types/common.types'
import { useState } from 'react'

export default function VendorDepositFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [isVoidOpen, setVoidOpen] = useState(false)

  const { data, isLoading } = useVendorDeposit(id ? Number(id) : undefined)
  const deposit = data?.data
  const { create, post, void: voidDep, refund, allocate } = useVendorDepositMutations()

  const { control, getValues, register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<VendorDepositFormValues>({
    resolver: zodResolver(vendorDepositSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [isRefundOpen, setRefundOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState(0)
  const [billId, setBillId] = useState<number | null>(null)
  const [allocationAmount, setAllocationAmount] = useState(0)

  const status = (deposit?.status ?? 'draft') as DocumentStatus
  const canAllocate = ['posted', 'partially_allocated'].includes(deposit?.status ?? '')
  const vendorContext = useVendorOpenBills(canAllocate ? deposit?.vendor_id : null)
  const openBills = vendorContext.data?.data?.open_bills ?? []
  const selectedBill = openBills.find((bill) => bill.vendor_bill_id === billId)
  const maxAllocation = Math.min(deposit?.remaining_amount ?? 0, selectedBill?.balance_due ?? deposit?.remaining_amount ?? 0)

  const formDraft = usePersistentFormDraft<VendorDepositFormValues, never>({
    draftKey: `purchase.deposit.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    enabled: isCreate,
  })

  useEffect(() => {
    if (deposit) {
      reset({ vendor_id: deposit.vendor_id, date: deposit.date, cash_bank_account_id: deposit.cash_bank_account_id, amount: deposit.amount, notes: deposit.notes ?? '' })
    }
  }, [deposit, reset])

  const handleSave = handleSubmit(async (values) => {
    try {
      const res = await create.mutateAsync(values)
      formDraft.clearDraft()
      toast.success('Deposit vendor berhasil dibuat.')
      navigate(`/purchase/vendor-deposits/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan deposit vendor.') }
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Deposit berhasil diposting.') } catch { toast.error('Gagal posting deposit.') } }
  const handleVoid = async (reason: string) => {
    await voidDep.mutateAsync({ id: Number(id), reason })
    toast.success('Deposit berhasil di-void.')
    setVoidOpen(false)
  }
  const handleAllocate = async () => {
    if (!billId || allocationAmount <= 0) return
    try {
      await allocate.mutateAsync({ depositId: Number(id), billId, amount: allocationAmount })
      toast.success('Deposit berhasil dialokasikan ke tagihan.')
      setBillId(null)
      setAllocationAmount(0)
    } catch (error) { toast.error(getApiErrorMessage(error, 'Alokasi deposit gagal.')) }
  }
  const handleRefund = async (reason?: string) => {
    if (refundAmount <= 0) return
    try {
      await refund.mutateAsync({ id: Number(id), amount: refundAmount, reason })
      toast.success('Refund deposit berhasil diproses.')
      setRefundOpen(false)
    } catch (error) { toast.error(getApiErrorMessage(error, 'Refund deposit gagal.')) }
  }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('purchase.deposits.create')) {
    actions.push({ id: 'save', label: 'Simpan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (deposit?.status === 'draft' && can('purchase.deposits.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (deposit?.status === 'posted' && can('purchase.deposits.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
    if (canAllocate && can('purchase.deposits.refund')) {
      actions.push({
        id: 'refund',
        label: 'Refund',
        variant: 'neutral',
        onClick: () => {
          if (refundAmount <= 0) setRefundAmount(deposit?.remaining_amount ?? 0)
          setRefundOpen(true)
        },
      })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Deposit Vendor" breadcrumb={[{ label: 'Pembelian' }, { label: 'Deposit Vendor', path: '/purchase/vendor-deposits' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Deposit Vendor' : 'Deposit Vendor'}
        documentNumber={deposit?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Deposit Vendor', path: '/purchase/vendor-deposits' }, { label: isCreate ? 'Buat Deposit' : (deposit?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={deposit?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('vendor_id') ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isCreate} error={errors.vendor_id?.message} selectedOptions={deposit?.vendor ? [{ value: deposit.vendor.id, label: deposit.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isCreate} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('cash_bank_account_id') ?? null} onChange={(v) => setValue('cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun kas/bank..." disabled={!isCreate} error={errors.cash_bank_account_id?.message} selectedOptions={deposit?.cash_bank_account ? [{ value: deposit.cash_bank_account.id, label: `${deposit.cash_bank_account.code} - ${deposit.cash_bank_account.name}` }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah <span className="text-red-500">*</span></Label>
              <Input {...register('amount', { valueAsNumber: true })} type="number" disabled={!isCreate} className="h-9 text-[13px] tabular-nums text-right" min={0} />
              {errors.amount && <p className="text-[11px] text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isCreate} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          {!isCreate && deposit && (
            <FormSection title="Alokasi">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah Deposit</span>
                <span className="tabular-nums text-[13px]">{formatCurrency(deposit.amount)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dialokasikan</span>
                <span className="tabular-nums text-[13px]">{formatCurrency(deposit.allocated_amount)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sisa</span>
                <span className="tabular-nums text-[13px] font-semibold text-[#5c9ead]">{formatCurrency(deposit.remaining_amount)}</span>
              </div>
            </FormSection>
          )}

          {canAllocate && deposit && can('purchase.deposits.post') && (
            <FormSection title="Alokasikan ke Tagihan">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tagihan Terbuka</Label>
                <SearchableSelect
                  value={billId}
                  onChange={setBillId}
                  onSearch={async (search) => openBills
                    .filter((bill) => bill.bill_number.toLowerCase().includes(search.toLowerCase()))
                    .map((bill) => ({ value: bill.vendor_bill_id, label: bill.bill_number, sublabel: formatCurrency(bill.balance_due) }))}
                  placeholder="Pilih tagihan..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="deposit-allocation-amount" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah Alokasi</Label>
                <div className="flex gap-2">
                  <Input id="deposit-allocation-amount" type="number" min={0} max={maxAllocation} value={allocationAmount} onChange={(event) => setAllocationAmount(Number(event.target.value))} className="h-9 text-right text-[13px] tabular-nums" />
                  <Button type="button" onClick={() => void handleAllocate()} disabled={!billId || allocationAmount <= 0 || allocationAmount > maxAllocation || allocate.isPending} className="h-9 bg-[#5c9ead] px-3 text-[13px] hover:bg-[#4a8a9b]">Alokasikan</Button>
                </div>
              </div>
            </FormSection>
          )}

          {canAllocate && deposit && can('purchase.deposits.refund') && (
            <FormSection title="Refund Deposit">
              <div className="flex flex-col gap-1">
                <Label htmlFor="deposit-refund-amount" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah Refund</Label>
                <Input id="deposit-refund-amount" type="number" min={0} max={deposit.remaining_amount} value={refundAmount} onChange={(event) => setRefundAmount(Number(event.target.value))} className="h-9 text-right text-[13px] tabular-nums" />
              </div>
            </FormSection>
          )}
        </div>
      </FormLayout>

      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={deposit?.number ?? ''} isLoading={voidDep.isPending} />
      <ConfirmDialog
        open={isRefundOpen}
        onOpenChange={setRefundOpen}
        title="Refund Deposit Vendor"
        description={`Refund maksimal ${formatCurrency(deposit?.remaining_amount ?? 0)} ke akun kas/bank asal.`}
        confirmLabel="Proses Refund"
        requireReason
        isLoading={refund.isPending}
        onConfirm={(reason) => void handleRefund(reason)}
      />
    </>
  )
}
