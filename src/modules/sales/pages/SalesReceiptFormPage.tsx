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
import { useSalesReceipt, useSalesReceiptMutations, useCustomerOpenInvoices } from '../hooks/useSalesReceiptList'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { salesReceiptSchema, type SalesReceiptFormValues } from '../schemas/salesReceiptSchema'
import { formatCurrency } from '@/lib/utils'
import type { DocumentStatus } from '@/types/common.types'

interface ReceiptLine {
  sales_invoice_id: number
  invoice_number: string
  balance_due: number
  amount: number
}

export default function SalesReceiptFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useSalesReceipt(id ? Number(id) : undefined)
  const receipt = data?.data
  const { create, post, void: voidRec } = useSalesReceiptMutations()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<SalesReceiptFormValues>({
    resolver: zodResolver(salesReceiptSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const [lines, setLines] = useState<ReceiptLine[]>([])
  const [isVoidOpen, setVoidOpen] = useState(false)

  const customerId = watch('customer_id')
  const { data: openInvoicesData } = useCustomerOpenInvoices(customerId && isCreate ? customerId : undefined)

  const status = (receipt?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate
  const totalAmount = lines.reduce((s, l) => s + l.amount, 0)

  useEffect(() => {
    if (receipt) {
      reset({
        customer_id: receipt.customer_id,
        date: receipt.date,
        cash_bank_account_id: receipt.cash_bank_account_id,
        amount: receipt.amount,
        notes: receipt.notes ?? '',
      })
      setLines(receipt.lines.map((l) => ({
        sales_invoice_id: l.sales_invoice_id,
        invoice_number: l.invoice?.number ?? String(l.sales_invoice_id),
        balance_due: l.invoice?.balance_due ?? 0,
        amount: l.amount,
      })))
    }
  }, [receipt, reset])

  useEffect(() => {
    setValue('amount', totalAmount)
  }, [totalAmount, setValue])

  const handleSave = handleSubmit(async (values) => {
    try {
      const res = await create.mutateAsync({
        ...values,
        lines: lines.map(({ sales_invoice_id, amount }) => ({ sales_invoice_id, amount })),
      })
      toast.success('Penerimaan berhasil disimpan.')
      navigate(`/sales/receipts/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan penerimaan.') }
  })

  const handlePost = async () => {
    try {
      await post.mutateAsync(Number(id))
      toast.success('Penerimaan berhasil diposting.')
    } catch { toast.error('Gagal memposting penerimaan.') }
  }

  const handleVoid = async (reason: string) => {
    await voidRec.mutateAsync({ id: Number(id), reason })
    toast.success('Penerimaan berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('sales.receipts.create')) {
    actions.push({ id: 'save', label: 'Simpan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (receipt?.status === 'draft' && can('sales.receipts.post')) {
      actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
    }
    if (receipt?.status === 'posted' && can('sales.receipts.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  const openInvoices = openInvoicesData?.data?.open_invoices ?? []

  const addInvoiceLine = (invoiceId: number) => {
    const inv = openInvoices.find((i) => i.id === invoiceId)
    if (!inv || lines.find((l) => l.sales_invoice_id === invoiceId)) return
    setLines((prev) => [...prev, {
      sales_invoice_id: inv.id,
      invoice_number: inv.number,
      balance_due: inv.balance_due,
      amount: inv.balance_due,
    }])
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Penerimaan" breadcrumb={[{ label: 'Sales' }, { label: 'Penerimaan', path: '/sales/receipts' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Penerimaan' : 'Penerimaan Penjualan'}
        documentNumber={receipt?.number}
        status={status}
        breadcrumb={[
          { label: 'Sales' },
          { label: 'Penerimaan', path: '/sales/receipts' },
          { label: isCreate ? 'Buat Penerimaan' : (receipt?.number ?? '') },
        ]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={receipt?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Informasi Penerimaan">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Customer <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={watch('customer_id') ?? null}
                onChange={(v) => { setValue('customer_id', v as number); setLines([]) }}
                onSearch={(q) => kontakApi.search(q, 'customer')}
                placeholder="Pilih customer..."
                disabled={!isEditable}
                error={errors.customer_id?.message}
                selectedOptions={receipt?.customer ? [{ value: receipt.customer.id, label: receipt.customer.name }] : []}
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
                selectedOptions={receipt?.cash_bank_account ? [{ value: receipt.cash_bank_account.id, label: receipt.cash_bank_account.name, sublabel: receipt.cash_bank_account.code }] : []}
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              <Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
            </div>
          </FormSection>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Invoice yang Dibayar</p>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
              <table className="min-w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#eeeeee]">
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">Invoice</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Sisa Tagihan</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-[#64748b]">Jumlah Bayar</th>
                    {isEditable && <th className="w-8 px-2 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-[13px] text-[#94a3b8]">
                        {customerId ? 'Pilih invoice untuk dibayar' : 'Pilih customer terlebih dahulu'}
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, i) => (
                      <tr key={line.sales_invoice_id} className="border-b border-[#f1f5f9] last:border-b-0">
                        <td className="px-3 py-2 font-medium text-[#5c9ead]">{line.invoice_number}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(line.balance_due)}</td>
                        <td className="px-3 py-2 text-right">
                          {isEditable ? (
                            <Input
                              type="number"
                              value={line.amount}
                              onChange={(e) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, amount: Number(e.target.value) } : l))}
                              min={0}
                              max={line.balance_due}
                              className="h-7 w-32 text-right tabular-nums text-[12px]"
                            />
                          ) : (
                            <span className="tabular-nums">{formatCurrency(line.amount)}</span>
                          )}
                        </td>
                        {isEditable && (
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-[#94a3b8] hover:text-[#ef4444] text-[11px]"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {isEditable && openInvoices.length > 0 && (
                <div className="border-t border-[#d9e2e5] p-2">
                  <p className="mb-1.5 text-[11px] text-[#64748b]">Invoice terbuka:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {openInvoices
                      .filter((inv) => !lines.find((l) => l.sales_invoice_id === inv.id))
                      .map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => addInvoiceLine(inv.id)}
                          className="rounded border border-[#d9e2e5] px-2 py-1 text-[11px] text-[#326273] hover:border-[#5c9ead] hover:bg-[#f8fbfc]"
                        >
                          {inv.number} ({formatCurrency(inv.balance_due)})
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <div className="text-[14px] font-semibold text-[#24323a]">
                Total: <span className="tabular-nums">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </FormLayout>

      <VoidConfirmDialog
        isOpen={isVoidOpen}
        onClose={() => setVoidOpen(false)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={receipt?.number ?? ''}
        isLoading={voidRec.isPending}
      />
    </>
  )
}
