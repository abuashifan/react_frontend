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
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { useCashReceipt, useCashReceiptMutations } from '../hooks/useCashBankList'
import { cashReceiptSchema, type CashReceiptFormValues } from '../schemas/cashBankSchemas'
import type { DocumentStatus } from '@/types/common.types'

interface EditableLine { account_id: number | null; amount: number; description: string }
const DEFAULT_LINE: EditableLine = { account_id: null, amount: 0, description: '' }

export default function CashReceiptFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useCashReceipt(id ? Number(id) : undefined)
  const receipt = data?.data
  const { create, post, void: voidReceipt } = useCashReceiptMutations()
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<CashReceiptFormValues>({ resolver: zodResolver(cashReceiptSchema), defaultValues: { receipt_date: new Date().toISOString().slice(0, 10) } })
  const [lines, setLines] = useState<EditableLine[]>([DEFAULT_LINE])
  const [isVoidOpen, setVoidOpen] = useState(false)
  const status = (receipt?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate

  useEffect(() => {
    if (receipt) {
      reset({ receipt_date: receipt.receipt_date, cash_bank_account_id: receipt.cash_bank_account_id, contact_id: receipt.contact_id, amount: receipt.amount, notes: receipt.notes ?? '' })
      setLines(receipt.lines.map((l) => ({ account_id: l.account_id, amount: l.amount, description: l.description ?? '' })))
    }
  }, [receipt, reset])

  const handleSave = handleSubmit(async (values) => {
    const linePayloads = lines.filter((l) => l.account_id).map((l) => ({ account_id: l.account_id!, amount: l.amount, description: l.description || null }))
    try {
      const res = await create.mutateAsync({ ...values, lines: linePayloads.length ? linePayloads : undefined })
      toast.success('Penerimaan kas berhasil dibuat.')
      navigate(`/cash-bank/cash-receipts/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan penerimaan kas.') }
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Diposting.') } catch { toast.error('Gagal posting.') } }
  const handleVoid = async (reason: string) => { await voidReceipt.mutateAsync({ id: Number(id), reason }); toast.success('Berhasil di-void.'); setVoidOpen(false) }

  const columns: LineItemColumn<EditableLine>[] = [
    { id: 'account', header: 'Akun Lawan', width: 200, render: ({ item, isReadOnly, onUpdate }) => <SearchableSelect value={item.account_id} onChange={(v) => onUpdate('account_id', v)} onSearch={coaApi.search} placeholder="Pilih akun..." disabled={isReadOnly} size="sm" /> },
    { id: 'amount', header: 'Jumlah', width: 130, align: 'right', render: ({ item, isReadOnly, onUpdate }) => <Input type="number" value={item.amount || ''} onChange={(e) => onUpdate('amount', Number(e.target.value))} disabled={isReadOnly} className="h-8 text-[12px] text-right" min={0} /> },
    { id: 'description', header: 'Keterangan', width: 180, render: ({ item, isReadOnly, onUpdate }) => <Input value={item.description} onChange={(e) => onUpdate('description', e.target.value)} disabled={isReadOnly} placeholder="Keterangan..." className="h-8 text-[12px]" /> },
  ]

  const actions: DocumentActionButton[] = []
  if (isCreate && can('cash_bank.create')) actions.push({ id: 'save', label: 'Simpan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  if (!isCreate && receipt?.status === 'draft' && can('cash_bank.post')) actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
  if (!isCreate && receipt?.status === 'posted' && can('cash_bank.void')) actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })

  if (!isCreate && isLoading) return <FormLayout title="Penerimaan Kas" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Penerimaan Kas', path: '/cash-bank/cash-receipts' }, { label: 'Memuat...' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>

  return (
    <>
      <FormLayout title={isCreate ? 'Buat Penerimaan Kas' : 'Penerimaan Kas'} documentNumber={receipt?.number} status={status}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Penerimaan Kas', path: '/cash-bank/cash-receipts' }, { label: isCreate ? 'Buat' : (receipt?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={receipt?.number} actions={actions} />}>
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label><Input {...register('receipt_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />{errors.receipt_date && <p className="text-[11px] text-red-500">{errors.receipt_date.message}</p>}</div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank <span className="text-red-500">*</span></Label><SearchableSelect value={watch('cash_bank_account_id') ?? null} onChange={(v) => setValue('cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun kas/bank..." disabled={!isEditable} error={errors.cash_bank_account_id?.message} selectedOptions={receipt?.cash_bank_account ? [{ value: receipt.cash_bank_account.id, label: receipt.cash_bank_account.name }] : []} /></div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kontak</Label><SearchableSelect value={watch('contact_id') ?? null} onChange={(v) => setValue('contact_id', v)} onSearch={kontakApi.search} placeholder="Pilih kontak..." disabled={!isEditable} selectedOptions={receipt?.contact ? [{ value: receipt.contact.id, label: receipt.contact.name }] : []} /></div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah <span className="text-red-500">*</span></Label><Input {...register('amount', { valueAsNumber: true })} type="number" disabled={!isEditable} className="h-9 text-[13px] text-right tabular-nums" min={0} />{errors.amount && <p className="text-[11px] text-red-500">{errors.amount.message}</p>}</div>
            <div className="flex flex-col gap-1 md:col-span-2"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label><Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} /></div>
          </FormSection>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alokasi Akun (Opsional)</p>
            <LineItemsTable items={lines} columns={columns} onAdd={() => setLines((prev) => [...prev, { ...DEFAULT_LINE }])} onRemove={(i) => setLines((prev) => prev.filter((_, idx) => idx !== i))} onUpdate={(i, field, value) => setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))} isReadOnly={!isEditable} addLabel="Tambah Baris" />
          </div>
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={receipt?.number ?? ''} isLoading={voidReceipt.isPending} />
    </>
  )
}
