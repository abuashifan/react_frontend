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
import { coaApi } from '@/modules/master-data/services/coaApi'
import { useBankTransfer, useBankTransferMutations } from '../hooks/useCashBankList'
import { bankTransferSchema, type BankTransferFormValues } from '../schemas/cashBankSchemas'
import type { DocumentStatus } from '@/types/common.types'

export default function BankTransferFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useBankTransfer(id ? Number(id) : undefined)
  const transfer = data?.data
  const { create, post, void: voidTransfer } = useBankTransferMutations()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<BankTransferFormValues>({ resolver: zodResolver(bankTransferSchema), defaultValues: { transfer_date: new Date().toISOString().slice(0, 10) } })
  const status = (transfer?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate

  useEffect(() => {
    if (transfer) {
      reset({ transfer_date: transfer.transfer_date, from_cash_bank_account_id: transfer.from_cash_bank_account_id, to_cash_bank_account_id: transfer.to_cash_bank_account_id, amount: transfer.amount, notes: transfer.notes ?? '' })
    }
  }, [transfer, reset])

  const handleSave = handleSubmit(async (values) => {
    try {
      const res = await create.mutateAsync(values)
      toast.success('Transfer bank berhasil dibuat.')
      navigate(`/cash-bank/bank-transfers/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan transfer bank.') }
  })

  const handlePost = async () => { try { await post.mutateAsync(Number(id)); toast.success('Diposting.') } catch { toast.error('Gagal posting.') } }
  const handleVoid = async (reason: string) => { await voidTransfer.mutateAsync({ id: Number(id), reason }); toast.success('Berhasil di-void.'); setVoidOpen(false) }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('cash_bank.create')) actions.push({ id: 'save', label: 'Simpan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  if (!isCreate && transfer?.status === 'draft' && can('cash_bank.post')) actions.push({ id: 'post', label: 'Post', variant: 'primary', onClick: () => void handlePost(), isLoading: post.isPending })
  if (!isCreate && transfer?.status === 'posted' && can('cash_bank.void')) actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })

  if (!isCreate && isLoading) return <FormLayout title="Transfer Bank" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Transfer Bank', path: '/cash-bank/bank-transfers' }, { label: 'Memuat...' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>

  return (
    <>
      <FormLayout title={isCreate ? 'Buat Transfer Bank' : 'Transfer Bank'} documentNumber={transfer?.number} status={status}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Transfer Bank', path: '/cash-bank/bank-transfers' }, { label: isCreate ? 'Buat' : (transfer?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={transfer?.number} actions={actions} />}>
        <FormSection title="Header">
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label><Input {...register('transfer_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />{errors.transfer_date && <p className="text-[11px] text-red-500">{errors.transfer_date.message}</p>}</div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dari Akun <span className="text-red-500">*</span></Label><SearchableSelect value={watch('from_cash_bank_account_id') ?? null} onChange={(v) => setValue('from_cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun asal..." disabled={!isEditable} error={errors.from_cash_bank_account_id?.message} selectedOptions={transfer?.from_cash_bank_account ? [{ value: transfer.from_cash_bank_account.id, label: transfer.from_cash_bank_account.name }] : []} /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Ke Akun <span className="text-red-500">*</span></Label><SearchableSelect value={watch('to_cash_bank_account_id') ?? null} onChange={(v) => setValue('to_cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun tujuan..." disabled={!isEditable} error={errors.to_cash_bank_account_id?.message} selectedOptions={transfer?.to_cash_bank_account ? [{ value: transfer.to_cash_bank_account.id, label: transfer.to_cash_bank_account.name }] : []} /></div>
          <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah <span className="text-red-500">*</span></Label><Input {...register('amount', { valueAsNumber: true })} type="number" disabled={!isEditable} className="h-9 text-[13px] text-right tabular-nums" min={0} />{errors.amount && <p className="text-[11px] text-red-500">{errors.amount.message}</p>}</div>
          <div className="flex flex-col gap-1 md:col-span-2"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label><Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} /></div>
        </FormSection>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={transfer?.number ?? ''} isLoading={voidTransfer.isPending} />
    </>
  )
}
