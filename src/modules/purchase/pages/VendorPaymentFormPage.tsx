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
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { useVendorPayment, useVendorOpenBills, useVendorPaymentMutations } from '../hooks/useVendorPaymentList'
import { toVendorPaymentPayload } from '../services/vendorPaymentAdapter'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { vendorPaymentSchema, type VendorPaymentFormValues } from '../schemas/vendorPaymentSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { VendorPaymentLinePayload } from '../types/vendorPayment.types'

interface BillLine {
  vendor_bill_id: number
  bill_number: string
  balance_due: number
  amount: number
}

export default function VendorPaymentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [billLines, setBillLines] = useState<BillLine[]>([])

  const { data, isLoading } = useVendorPayment(id ? Number(id) : undefined)
  const payment = data?.data
  const { create, post, void: voidPayment } = useVendorPaymentMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<VendorPaymentFormValues>({
    resolver: zodResolver(vendorPaymentSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const vendorId = watch('vendor_id')
  const { data: vendorContextData } = useVendorOpenBills(isCreate ? vendorId : null)
  const openBills = vendorContextData?.data?.open_bills ?? []

  const status = (payment?.status ?? 'draft') as DocumentStatus
  const totalAmount = billLines.reduce((s, l) => s + l.amount, 0)

  useEffect(() => {
    if (payment) {
      reset({ vendor_id: payment.vendor_id, date: payment.date, cash_bank_account_id: payment.cash_bank_account_id, amount: payment.amount, notes: payment.notes ?? '' })
      setBillLines(payment.lines.map((l) => ({ vendor_bill_id: l.vendor_bill_id, bill_number: l.bill_number ?? '', balance_due: l.balance_due ?? 0, amount: l.amount })))
    }
  }, [payment, reset])

  useEffect(() => {
    if (isCreate) {
      setBillLines([])
    }
  }, [vendorId, isCreate])

  useEffect(() => {
    if (totalAmount > 0) setValue('amount', totalAmount)
  }, [totalAmount, setValue])

  const handleAddBill = (billId: number) => {
    const bill = openBills.find((b) => b.vendor_bill_id === billId)
    if (bill && !billLines.find((l) => l.vendor_bill_id === billId)) {
      setBillLines((prev) => [...prev, { vendor_bill_id: bill.vendor_bill_id, bill_number: bill.bill_number, balance_due: bill.balance_due, amount: bill.balance_due }])
    }
  }

  const handleSave = handleSubmit(async (values) => {
    try {
      const lines: VendorPaymentLinePayload[] = billLines.map((l) => ({ vendor_bill_id: l.vendor_bill_id, amount: l.amount }))
      const res = await create.mutateAsync({ ...toVendorPaymentPayload(values), lines })
      toast.success('Pembayaran vendor berhasil dibuat.')
      navigate(`/purchase/payments/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan pembayaran vendor.') }
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Pembayaran berhasil diposting.') } catch { toast.error('Gagal posting pembayaran.') } }
  const handleVoid = async (reason: string) => {
    await voidPayment.mutateAsync({ id: Number(id), reason })
    toast.success('Pembayaran berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('purchase.payments.create')) {
    actions.push({ id: 'save', label: 'Simpan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (payment?.status === 'draft' && can('purchase.payments.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (payment?.status === 'posted' && can('purchase.payments.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Pembayaran Vendor" breadcrumb={[{ label: 'Pembelian' }, { label: 'Pembayaran', path: '/purchase/payments' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Pembayaran Vendor' : 'Pembayaran Vendor'}
        documentNumber={payment?.number}
        status={status}
        breadcrumb={[{ label: 'Pembelian' }, { label: 'Pembayaran', path: '/purchase/payments' }, { label: isCreate ? 'Buat Pembayaran' : (payment?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={payment?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('vendor_id') ?? null} onChange={(v) => setValue('vendor_id', v as number)} onSearch={(q) => kontakApi.search(q, 'supplier')} placeholder="Pilih vendor..." disabled={!isCreate} error={errors.vendor_id?.message} selectedOptions={payment?.vendor ? [{ value: payment.vendor.id, label: payment.vendor.name }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              <Input {...register('date')} type="date" disabled={!isCreate} className="h-9 text-[13px]" />
              {errors.date && <p className="text-[11px] text-red-500">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank <span className="text-red-500">*</span></Label>
              <SearchableSelect value={watch('cash_bank_account_id') ?? null} onChange={(v) => setValue('cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun kas/bank..." disabled={!isCreate} error={errors.cash_bank_account_id?.message} selectedOptions={payment?.cash_bank_account ? [{ value: payment.cash_bank_account.id, label: `${payment.cash_bank_account.code} - ${payment.cash_bank_account.name}` }] : []} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Total Pembayaran</Label>
              <Input {...register('amount', { valueAsNumber: true })} type="number" disabled className="h-9 text-[13px] tabular-nums text-right" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isCreate} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tagihan yang Dibayar</p>
              {isCreate && vendorId && openBills.length > 0 && (
                <SearchableSelect
                  value={null}
                  onChange={(v) => { if (v) handleAddBill(v as number) }}
                  onSearch={async (q) => openBills.filter((b) => b.bill_number.includes(q)).map((b) => ({ value: b.vendor_bill_id, label: b.bill_number, sublabel: formatCurrency(b.balance_due) }))}
                  placeholder="Tambah tagihan..."
                  size="sm"
                />
              )}
            </div>
            <div className="overflow-auto rounded border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Nomor Bill</th>
                    <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Sisa Tagihan</th>
                    <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Dibayar</th>
                    {isCreate && <th className="w-8 px-2 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {billLines.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-[#94a3b8]">Belum ada tagihan dipilih</td></tr>
                  ) : billLines.map((line, i) => (
                    <tr key={line.vendor_bill_id} className="border-t border-[#f1f5f9]">
                      <td className="px-3 py-2 font-medium text-[#5c9ead]">{line.bill_number}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(line.balance_due)}</td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number" value={line.amount}
                          onChange={(e) => setBillLines((prev) => prev.map((l, idx) => idx === i ? { ...l, amount: Number(e.target.value) } : l))}
                          disabled={!isCreate} className="h-7 w-28 text-[12px] tabular-nums text-right" min={0}
                        />
                      </td>
                      {isCreate && (
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => setBillLines((prev) => prev.filter((_, idx) => idx !== i))} className="text-[#94a3b8] hover:text-red-500">×</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {billLines.length > 0 && (
                  <tfoot className="border-t border-[#e2e8f0] bg-[#f8fafc]">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 font-semibold text-[#64748b]">Total</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCurrency(totalAmount)}</td>
                      {isCreate && <td />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={payment?.number ?? ''} isLoading={voidPayment.isPending} />
    </>
  )
}
