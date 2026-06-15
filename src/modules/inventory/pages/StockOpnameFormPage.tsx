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
import { formatNumber, formatDate } from '@/lib/utils'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import { useStockOpname, useStockOpnameMutations } from '../hooks/useStockOpnameList'
import { stockOpnameSchema, type StockOpnameFormValues } from '../schemas/stockOpnameSchema'
import type { DocumentStatus } from '@/types/common.types'
import type { StockOpnameLine } from '../types/stockOpname.types'

export default function StockOpnameFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()
  const { can } = usePermission()

  const { data, isLoading } = useStockOpname(id ? Number(id) : undefined)
  const opname = data?.data
  const { create, generateLines, updateLine, markCounted, finalize, void: voidOpname } = useStockOpnameMutations()

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<StockOpnameFormValues>({
    resolver: zodResolver(stockOpnameSchema),
    defaultValues: { opname_date: new Date().toISOString().slice(0, 10) },
  })

  const [isVoidOpen, setVoidOpen] = useState(false)
  const [lineInputs, setLineInputs] = useState<Record<number, { qty: string; reason: string }>>({})

  useEffect(() => {
    if (opname?.lines) {
      const inputs: Record<number, { qty: string; reason: string }> = {}
      opname.lines.forEach((l) => {
        inputs[l.id] = {
          qty: l.physical_quantity != null ? String(l.physical_quantity) : '',
          reason: '',
        }
      })
      setLineInputs(inputs)
    }
  }, [opname?.lines])

  const status = (opname?.status ?? 'draft') as DocumentStatus

  const handleCreate = handleSubmit(async (values) => {
    try {
      const res = await create.mutateAsync(values)
      toast.success('Opname berhasil dibuat.')
      navigate(`/inventory/opnames/${res.data.id}`)
    } catch { toast.error('Gagal membuat opname.') }
  })

  const handleGenerateLines = async () => {
    try { await generateLines.mutateAsync(Number(id)); toast.success('Lines berhasil digenerate.') }
    catch { toast.error('Gagal generate lines.') }
  }

  const handleUpdateLine = async (lineId: number) => {
    const input = lineInputs[lineId]
    if (!input) return
    const qty = parseFloat(input.qty)
    if (isNaN(qty) || qty < 0) { toast.error('Masukkan qty fisik yang valid.'); return }
    try {
      await updateLine.mutateAsync({ id: Number(id), lineId, physical_quantity: qty, reason: input.reason || undefined })
      toast.success('Qty fisik tersimpan.')
    } catch { toast.error('Gagal menyimpan qty fisik.') }
  }

  const handleMarkCounted = async () => {
    try { await markCounted.mutateAsync(Number(id)); toast.success('Opname ditandai selesai dihitung.') }
    catch { toast.error('Gagal mark counted.') }
  }

  const handleFinalize = async () => {
    try { await finalize.mutateAsync(Number(id)); toast.success('Opname berhasil difinalisasi.') }
    catch { toast.error('Gagal finalisasi opname.') }
  }

  const handleVoid = async (reason: string) => {
    await voidOpname.mutateAsync({ id: Number(id), reason })
    toast.success('Opname berhasil di-void.')
    setVoidOpen(false)
  }

  const actions: DocumentActionButton[] = []
  if (isCreate && can('inventory.opnames.create')) {
    actions.push({ id: 'save', label: 'Buat Opname', variant: 'primary', onClick: () => void handleCreate(), isLoading: isSubmitting })
  }
  if (!isCreate) {
    if (opname?.status === 'draft' && can('inventory.opnames.edit')) {
      actions.push({ id: 'generate', label: 'Generate Lines', variant: 'secondary', onClick: () => void handleGenerateLines(), isLoading: generateLines.isPending })
    }
    if (opname?.status === 'draft' && (opname.lines?.length ?? 0) > 0 && can('inventory.opnames.edit')) {
      actions.push({ id: 'counted', label: 'Tandai Selesai Hitung', variant: 'secondary', onClick: () => void handleMarkCounted(), isLoading: markCounted.isPending })
    }
    if (opname?.status === 'counted' && can('inventory.opnames.finalize')) {
      actions.push({ id: 'finalize', label: 'Finalisasi', variant: 'primary', onClick: () => void handleFinalize(), isLoading: finalize.isPending })
    }
    if (['draft', 'counted'].includes(opname?.status ?? '') && can('inventory.opnames.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
    if (opname?.status === 'finalized' && can('inventory.opnames.void')) {
      actions.push({ id: 'void', label: 'Void', variant: 'destructive', onClick: () => setVoidOpen(true) })
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Opname Stok" breadcrumb={[{ label: 'Inventori' }, { label: 'Opname', path: '/inventory/opnames' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  const canEditLines = opname?.status === 'draft'

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Opname Stok' : 'Opname Stok'}
        documentNumber={opname?.number}
        status={status}
        breadcrumb={[{ label: 'Inventori' }, { label: 'Opname', path: '/inventory/opnames' }, { label: isCreate ? 'Buat Opname' : (opname?.number ?? '') }]}
        bottomBar={<DocumentActionBar documentStatus={status} documentNumber={opname?.number} actions={actions} />}
      >
        <div className="space-y-3">
          <FormSection title="Header">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal <span className="text-red-500">*</span></Label>
              {isCreate
                ? <><Input {...register('opname_date')} type="date" className="h-9 text-[13px]" />{errors.opname_date && <p className="text-[11px] text-red-500">{errors.opname_date.message}</p>}</>
                : <span className="text-[13px] text-[#334155]">{opname ? formatDate(opname.opname_date) : '-'}</span>
              }
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Gudang <span className="text-red-500">*</span></Label>
              {isCreate
                ? <SearchableSelect value={watch('warehouse_id') ?? null} onChange={(v) => setValue('warehouse_id', v as number)} onSearch={gudangApi.search} placeholder="Pilih gudang..." error={errors.warehouse_id?.message} />
                : <span className="text-[13px] text-[#334155]">{opname?.warehouse?.name ?? '-'}</span>
              }
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
              {isCreate
                ? <Textarea {...register('notes')} placeholder="Catatan..." className="resize-none text-[13px]" rows={2} />
                : <span className="text-[13px] text-[#334155]">{opname?.notes ?? '-'}</span>
              }
            </div>
          </FormSection>

          {!isCreate && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                  Item ({opname?.lines?.length ?? 0} produk)
                </p>
              </div>

              {(opname?.lines?.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center">
                  <p className="text-[13px] text-[#64748b]">Belum ada lines. Klik "Generate Lines" untuk mengisi stok dari gudang.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                        <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Produk</th>
                        <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Qty Sistem</th>
                        <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Qty Fisik</th>
                        <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Selisih</th>
                        <th className="px-3 py-2 text-right font-semibold text-[#64748b]">Nilai Selisih</th>
                        {canEditLines && <th className="px-3 py-2 text-left font-semibold text-[#64748b]">Alasan</th>}
                        {canEditLines && <th className="px-3 py-2" />}
                      </tr>
                    </thead>
                    <tbody>
                      {(opname?.lines ?? []).map((line: StockOpnameLine) => {
                        const input = lineInputs[line.id] ?? { qty: '', reason: '' }
                        const diff = line.difference_quantity
                        const diffCls = diff == null ? '' : diff < 0 ? 'text-red-600 font-semibold' : diff > 0 ? 'text-green-600 font-semibold' : 'text-[#94a3b8]'
                        return (
                          <tr key={line.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                            <td className="px-3 py-2">
                              <div className="font-medium text-[#334155]">{line.product?.name ?? '-'}</div>
                              <div className="text-[11px] text-[#94a3b8]">{line.product?.code}</div>
                            </td>
                            <td className="px-3 py-2 tabular-nums text-right text-[#334155]">{formatNumber(line.system_quantity, 4)}</td>
                            <td className="px-3 py-2">
                              {canEditLines ? (
                                <Input
                                  type="number"
                                  value={input.qty}
                                  onChange={(e) => setLineInputs((prev) => ({ ...prev, [line.id]: { ...input, qty: e.target.value } }))}
                                  className="h-7 w-24 text-right text-[12px]"
                                  min={0}
                                  step="any"
                                />
                              ) : (
                                <span className="tabular-nums text-right">{line.physical_quantity != null ? formatNumber(line.physical_quantity, 4) : '-'}</span>
                              )}
                            </td>
                            <td className={`px-3 py-2 tabular-nums text-right ${diffCls}`}>
                              {diff != null ? (diff >= 0 ? '+' : '') + formatNumber(diff, 4) : '-'}
                            </td>
                            <td className={`px-3 py-2 tabular-nums text-right ${line.difference_value != null && line.difference_value < 0 ? 'text-red-600' : ''}`}>
                              {line.difference_value != null ? formatNumber(line.difference_value, 2) : '-'}
                            </td>
                            {canEditLines && (
                              <td className="px-3 py-2">
                                <Input
                                  value={input.reason}
                                  onChange={(e) => setLineInputs((prev) => ({ ...prev, [line.id]: { ...input, reason: e.target.value } }))}
                                  placeholder="Alasan..."
                                  className="h-7 text-[12px]"
                                />
                              </td>
                            )}
                            {canEditLines && (
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => void handleUpdateLine(line.id)}
                                  className="rounded bg-[#5c9ead] px-2 py-1 text-[11px] text-white hover:bg-[#4a8a9c] disabled:opacity-50"
                                  disabled={updateLine.isPending}
                                >
                                  Simpan
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </FormLayout>
      <VoidConfirmDialog isOpen={isVoidOpen} onClose={() => setVoidOpen(false)} onConfirm={(reason) => void handleVoid(reason)} documentNumber={opname?.number ?? ''} isLoading={voidOpname.isPending} />
    </>
  )
}
