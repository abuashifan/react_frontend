import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useCustomerDeposit, useCustomerDepositMutations } from '../hooks/useCustomerDepositList'
import { useCustomerOpenInvoices } from '../hooks/useSalesReceiptList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { customerDepositSchema, type CustomerDepositFormValues } from '../schemas/customerDepositSchema'
import { formatCurrency } from '@/lib/utils'
import type { DocumentStatus } from '@/types/common.types'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { Button } from '@/components/ui/button'

export default function CustomerDepositFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const query = useCustomerDeposit(id ? Number(id) : undefined)
  const { data, isLoading } = query
  const deposit = data?.data
  const { create, post, void: voidDep, refund, allocate } = useCustomerDepositMutations()

  const { control, getValues, register, handleSubmit, setError, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<CustomerDepositFormValues>({
    resolver: zodResolver(customerDepositSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [isVoidOpen, setVoidOpen] = useState(false)
  const [isRefundOpen, setRefundOpen] = useState(false)
  const [isPostOpen, setPostOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState(0)
  const [invoiceId, setInvoiceId] = useState<number | null>(null)
  const [allocationAmount, setAllocationAmount] = useState(0)

  const status = (deposit?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate
  const customerContext = useCustomerOpenInvoices(deposit?.customer_id)
  const selectedInvoice = customerContext.data?.data.open_invoices.find((invoice) => invoice.id === invoiceId)
  const maxAllocation = Math.min(deposit?.remaining_amount ?? 0, selectedInvoice?.balance_due ?? deposit?.remaining_amount ?? 0)

  const formDraft = usePersistentFormDraft<CustomerDepositFormValues>({
    draftKey: `sales.customer-deposit.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    enabled: isCreate,
  })

  useEffect(() => {
    if (deposit) {
      reset({
        customer_id: deposit.customer_id,
        date: deposit.date,
        cash_bank_account_id: deposit.cash_bank_account_id,
        amount: deposit.amount,
        notes: deposit.notes ?? '',
      })
    }
  }, [deposit, reset])

  const handleSave = handleSubmit(async (values) => {
    try {
      const res = await create.mutateAsync(values)
      formDraft.clearDraft()
      toast.success('Deposit berhasil disimpan.')
      navigate(`/sales/customer-deposits/${res.data.id}`)
    } catch (error) {
      applyApiValidationErrors(error, setError, { deposit_date: 'date' })
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan deposit.'))
    }
  })

  const handleRefund = async (reason?: string) => {
    if (!reason || refundAmount <= 0) return
    try {
      await refund.mutateAsync({ id: Number(id), amount: refundAmount, reason })
      toast.success('Refund deposit berhasil diproses.')
      setRefundOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Refund deposit gagal.'))
    }
  }

  const handleAllocate = async () => {
    if (!invoiceId || allocationAmount <= 0) return
    try {
      await allocate.mutateAsync({ depositId: Number(id), invoiceId, payload: { amount: allocationAmount } })
      toast.success('Deposit berhasil dialokasikan ke invoice.')
      setInvoiceId(null)
      setAllocationAmount(0)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Alokasi deposit gagal.'))
    }
  }

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      toast.success('Deposit berhasil diposting.')
      setPostOpen(false)
    } catch { toast.error('Gagal memposting deposit.') }
  }

  const handleVoid = async (reason: string) => {
    await voidDep.mutateAsync({ id: Number(id), reason })
    toast.success('Deposit berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('sales.deposits.create')) {
    actions.push({ id: 'save', label: 'Simpan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (deposit?.status === 'draft' && can('sales.deposits.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => setPostOpen(true), isLoading: post.isPending })
    }
    if (deposit?.status === 'posted' && can('sales.deposits.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
    if (['posted', 'partially_allocated'].includes(deposit?.status ?? '') && can('sales.deposits.refund')) {
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
      <FormLayout title="Deposit Customer" breadcrumb={[{ label: 'Sales' }, { label: 'Deposit Customer', path: '/sales/customer-deposits' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  if (!isCreate && query.isError) {
    return (
      <FormLayout title="Deposit Customer" breadcrumb={[{ label: 'Sales' }, { label: 'Deposit Customer', path: '/sales/customer-deposits' }, { label: 'Gagal dimuat' }]}>
        <QueryErrorState error={query.error} onRetry={() => void query.refetch()} title="Deposit gagal dimuat" />
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Deposit Customer' : 'Deposit Customer'}
        documentNumber={deposit?.number}
        status={status}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Deposit Customer', path: '/sales/customer-deposits' },
          { label: isCreate ? 'Buat Deposit' : (deposit?.number ?? '') },
        ]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={deposit?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Informasi Deposit">
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
                selectedOptions={deposit?.customer ? [{ value: deposit.customer.id, label: deposit.customer.name }] : []}
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
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Akun Kas/Bank <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={watch('cash_bank_account_id') ?? null}
                onChange={(v) => setValue('cash_bank_account_id', v as number)}
                onSearch={coaApi.search}
                placeholder="Pilih akun..."
                disabled={!isEditable}
                error={errors.cash_bank_account_id?.message}
                selectedOptions={deposit?.cash_bank_account ? [{ value: deposit.cash_bank_account.id, label: deposit.cash_bank_account.name, sublabel: deposit.cash_bank_account.code }] : []}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Jumlah <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                min={0}
                disabled={!isEditable}
                className="h-9 text-[13px] text-right tabular-nums"
                placeholder="0"
              />
              {errors.amount && <p className="text-[11px] text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          {deposit && (
            <div className="rounded-lg border border-[#d9e2e5] bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Ringkasan Alokasi</p>
              <div className="space-y-1 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Total Deposit</span>
                  <span className="tabular-nums font-medium">{formatCurrency(deposit.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Terpakai</span>
                  <span className="tabular-nums text-[#991B1B]">{formatCurrency(deposit.allocated_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-[#d9e2e5] pt-1 font-semibold">
                  <span>Sisa</span>
                  <span className="tabular-nums text-[#065F46]">{formatCurrency(deposit.remaining_amount)}</span>
                </div>
              </div>
            </div>
          )}

          {deposit && ['posted', 'partially_allocated'].includes(deposit.status) && can('sales.deposits.post') && (
            <FormSection title="Alokasikan ke Invoice">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Invoice Terbuka</Label>
                <SearchableSelect
                  value={invoiceId}
                  onChange={setInvoiceId}
                  onSearch={async (search) => (customerContext.data?.data.open_invoices ?? [])
                    .filter((invoice) => invoice.number.toLowerCase().includes(search.toLowerCase()))
                    .map((invoice) => ({ value: invoice.id, label: invoice.number, sublabel: formatCurrency(invoice.balance_due) }))}
                  placeholder="Pilih invoice..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="deposit-allocation-amount" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah Alokasi</Label>
                <div className="flex gap-2">
                  <Input id="deposit-allocation-amount" type="number" min={0} max={maxAllocation} value={allocationAmount} onChange={(event) => setAllocationAmount(Number(event.target.value))} className="h-9 text-right text-[13px] tabular-nums" />
                  <Button type="button" onClick={() => void handleAllocate()} disabled={!invoiceId || allocationAmount <= 0 || allocationAmount > maxAllocation || allocate.isPending} className="h-9 bg-[#5c9ead] px-3 text-[13px] hover:bg-[#4a8a9b]">Alokasikan</Button>
                </div>
              </div>
            </FormSection>
          )}

          {deposit && ['posted', 'partially_allocated'].includes(deposit.status) && can('sales.deposits.refund') && (
            <FormSection title="Refund Deposit">
              <div className="flex flex-col gap-1">
                <Label htmlFor="deposit-refund-amount" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah Refund</Label>
                <Input
                  id="deposit-refund-amount"
                  type="number"
                  min={0}
                  max={deposit.remaining_amount}
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(Number(event.target.value))}
                  className="h-9 text-right text-[13px] tabular-nums"
                />
              </div>
            </FormSection>
          )}
        </div>
      </FormLayout>

      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={deposit?.number ?? ''}
        isLoading={voidDep.isPending}
      />
      <ConfirmDialog
        open={isPostOpen}
        onOpenChange={setPostOpen}
        title="Post Deposit Customer"
        description="Posting akan membentuk jurnal penerimaan dan membuat deposit tersedia untuk alokasi."
        confirmLabel="Post Deposit"
        isLoading={post.isPending}
        onConfirm={() => void handlePost()}
      />
      <ConfirmDialog
        open={isRefundOpen}
        onOpenChange={setRefundOpen}
        title="Refund Deposit"
        description={`Refund maksimal ${formatCurrency(deposit?.remaining_amount ?? 0)} ke akun kas/bank asal.`}
        confirmLabel="Proses Refund"
        requireReason
        isLoading={refund.isPending}
        onConfirm={(reason) => void handleRefund(reason)}
      />
    </>
  )
}
