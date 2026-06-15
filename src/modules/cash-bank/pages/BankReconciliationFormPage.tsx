import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RefreshCw } from 'lucide-react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { DocumentActionBar, type DocumentActionButton } from '@/components/shared/document/DocumentActionBar'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useBankReconciliation, useBankReconciliationMutations } from '../hooks/useCashBankList'
import { bankReconciliationSchema, type BankReconciliationFormValues } from '../schemas/cashBankSchemas'
import type { DocumentStatus } from '@/types/common.types'
import type { BankReconciliationLine } from '../types/cashBank.types'

export default function BankReconciliationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useBankReconciliation(id ? Number(id) : undefined)
  const reconciliation = data?.data
  const { create, refreshLines, markLines, finalize, void: voidRecon } = useBankReconciliationMutations()
  const [isVoidOpen, setVoidOpen] = useState(false)
  const [selectedLineIds, setSelectedLineIds] = useState<Set<number>>(new Set())
  const [clearedDate, setClearedDate] = useState(new Date().toISOString().slice(0, 10))
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<BankReconciliationFormValues>({ resolver: zodResolver(bankReconciliationSchema), defaultValues: { statement_start_date: new Date().toISOString().slice(0, 10), statement_end_date: new Date().toISOString().slice(0, 10) } })
  const status = (reconciliation?.status ?? 'draft') as DocumentStatus
  const isEditable = isCreate
  const isDraft = reconciliation?.status === 'draft'

  useEffect(() => {
    if (reconciliation) {
      reset({ cash_bank_account_id: reconciliation.cash_bank_account_id, statement_start_date: reconciliation.statement_start_date, statement_end_date: reconciliation.statement_end_date, statement_ending_balance: reconciliation.statement_ending_balance, notes: reconciliation.notes ?? '' })
    }
  }, [reconciliation, reset])

  const handleSave = handleSubmit(async (values) => {
    try {
      const res = await create.mutateAsync(values)
      toast.success('Rekonsiliasi bank berhasil dibuat.')
      navigate(`/cash-bank/bank-reconciliations/${res.data.id}`)
    } catch { toast.error('Gagal menyimpan rekonsiliasi bank.') }
  })

  const handleRefresh = async () => {
    try { await refreshLines.mutateAsync(Number(id)); toast.success('Transaksi berhasil dimuat ulang.') }
    catch { toast.error('Gagal memuat transaksi.') }
  }

  const handleMark = async (cleared: boolean) => {
    if (selectedLineIds.size === 0) { toast.error('Pilih minimal satu transaksi.'); return }
    try {
      await markLines.mutateAsync({ id: Number(id), lineIds: Array.from(selectedLineIds), cleared, clearedDate: cleared ? clearedDate : undefined })
      toast.success(cleared ? 'Ditandai cleared.' : 'Ditandai uncleared.')
      setSelectedLineIds(new Set())
    } catch { toast.error('Gagal menandai transaksi.') }
  }

  const handleFinalize = async () => {
    try { await finalize.mutateAsync(Number(id)); toast.success('Rekonsiliasi difinalisasi.') }
    catch { toast.error('Gagal finalisasi.') }
  }

  const handleVoid = async (reason: string) => {
    await voidRecon.mutateAsync({ id: Number(id), reason }); toast.success('Berhasil di-void.'); setVoidOpen(false)
  }

  const toggleLine = (lineId: number) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev)
      if (next.has(lineId)) next.delete(lineId)
      else next.add(lineId)
      return next
    })
  }

  const clearedLines = reconciliation?.lines.filter((l) => l.is_cleared) ?? []
  const clearedTotal = clearedLines.reduce((sum, l) => sum + (l.direction === 'in' ? l.amount : -l.amount), 0)

  const actions: DocumentActionButton[] = []
  if (isCreate && can('cash_bank.create')) actions.push({ id: 'save', label: 'Simpan', variant: 'secondary', onClick: () => void handleSave(), isLoading: isSubmitting })
  if (!isCreate && isDraft && can('cash_bank.post')) actions.push({ id: 'finalize', label: 'Finalisasi', variant: 'primary', onClick: () => void handleFinalize(), isLoading: finalize.isPending })
  if (!isCreate && reconciliation?.status !== 'void' && can('cash_bank.void')) actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })

  if (!isCreate && isLoading) return <FormLayout title="Rekonsiliasi Bank" breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Rekonsiliasi Bank', path: '/cash-bank/bank-reconciliations' }, { label: 'Memuat...' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></FormLayout>

  return (
    <>
      <FormLayout title={isCreate ? 'Buat Rekonsiliasi Bank' : 'Rekonsiliasi Bank'} documentNumber={reconciliation?.number} status={status}
        breadcrumb={[{ label: 'Kas & Bank' }, { label: 'Rekonsiliasi Bank', path: '/cash-bank/bank-reconciliations' }, { label: isCreate ? 'Buat' : (reconciliation?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={reconciliation?.number} actions={actions} />}>
        <div className="space-y-4">
          <FormSection title="Header">
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Bank <span className="text-red-500">*</span></Label><SearchableSelect value={watch('cash_bank_account_id') ?? null} onChange={(v) => setValue('cash_bank_account_id', v as number)} onSearch={coaApi.search} placeholder="Pilih akun bank..." disabled={!isEditable} error={errors.cash_bank_account_id?.message} selectedOptions={reconciliation?.cash_bank_account ? [{ value: reconciliation.cash_bank_account.id, label: reconciliation.cash_bank_account.name }] : []} /></div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Mulai <span className="text-red-500">*</span></Label><Input {...register('statement_start_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />{errors.statement_start_date && <p className="text-[11px] text-red-500">{errors.statement_start_date.message}</p>}</div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Akhir <span className="text-red-500">*</span></Label><Input {...register('statement_end_date')} type="date" disabled={!isEditable} className="h-9 text-[13px]" />{errors.statement_end_date && <p className="text-[11px] text-red-500">{errors.statement_end_date.message}</p>}</div>
            <div className="flex flex-col gap-1"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Saldo Akhir Rekening Koran <span className="text-red-500">*</span></Label><Input {...register('statement_ending_balance', { valueAsNumber: true })} type="number" disabled={!isEditable} className="h-9 text-[13px] text-right tabular-nums" />{errors.statement_ending_balance && <p className="text-[11px] text-red-500">{errors.statement_ending_balance.message}</p>}</div>
            <div className="flex flex-col gap-1 md:col-span-2"><Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label><Textarea {...register('notes')} disabled={!isEditable} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} /></div>
          </FormSection>

          {!isCreate && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Transaksi ({reconciliation?.lines.length ?? 0})</p>
                {isDraft && (
                  <div className="flex items-center gap-2">
                    <Input type="date" value={clearedDate} onChange={(e) => setClearedDate(e.target.value)} className="h-7 w-36 text-[12px]" />
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => void handleMark(true)} disabled={markLines.isPending || selectedLineIds.size === 0}>Cleared</Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => void handleMark(false)} disabled={markLines.isPending || selectedLineIds.size === 0}>Uncleared</Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => void handleRefresh()} disabled={refreshLines.isPending}><RefreshCw className="mr-1 h-3 w-3" /> Muat Ulang</Button>
                  </div>
                )}
              </div>

              <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      {isDraft && <th className="w-9 px-3 py-2" />}
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keterangan</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sumber</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Masuk</th>
                      <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keluar</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Cleared</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tgl Cleared</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {(reconciliation?.lines ?? []).map((line: BankReconciliationLine) => (
                      <tr key={line.id} className={`hover:bg-[#f8fafc] ${line.is_cleared ? 'bg-green-50/30' : ''}`}>
                        {isDraft && <td className="px-3 py-2"><Checkbox checked={selectedLineIds.has(line.id)} onCheckedChange={() => toggleLine(line.id)} /></td>}
                        <td className="px-3 py-2 text-[#334155]">{formatDate(line.transaction_date)}</td>
                        <td className="px-3 py-2 text-[#334155]">{line.description ?? '-'}</td>
                        <td className="px-3 py-2 text-[#64748b]">{line.source_number ?? line.source_type ?? '-'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-green-700">{line.direction === 'in' ? formatCurrency(line.amount) : '-'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-red-600">{line.direction === 'out' ? formatCurrency(line.amount) : '-'}</td>
                        <td className="px-3 py-2 text-center">{line.is_cleared ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">✓</span> : <span className="text-[#94a3b8]">—</span>}</td>
                        <td className="px-3 py-2 text-[#64748b]">{line.cleared_date ? formatDate(line.cleared_date) : '-'}</td>
                      </tr>
                    ))}
                    {(reconciliation?.lines.length ?? 0) === 0 && (
                      <tr><td colSpan={isDraft ? 8 : 7} className="py-8 text-center text-[#94a3b8]">Belum ada transaksi. Klik "Muat Ulang" untuk memuat transaksi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <div className="min-w-64 space-y-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="flex justify-between text-[12px]"><span className="text-[#64748b]">Saldo Akhir Rekening Koran</span><span className="tabular-nums font-medium">{formatCurrency(reconciliation?.statement_ending_balance ?? 0)}</span></div>
                  <div className="flex justify-between text-[12px]"><span className="text-[#64748b]">Total Transaksi Cleared</span><span className="tabular-nums font-medium">{formatCurrency(clearedTotal)}</span></div>
                  <div className="flex justify-between border-t border-[#e2e8f0] pt-1 text-[12px]"><span className="font-semibold text-[#334155]">Selisih</span><span className={`tabular-nums font-semibold ${Math.abs((reconciliation?.statement_ending_balance ?? 0) - clearedTotal) < 0.01 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency((reconciliation?.statement_ending_balance ?? 0) - clearedTotal)}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={reconciliation?.number ?? ''} isLoading={voidRecon.isPending} />
    </>
  )
}
