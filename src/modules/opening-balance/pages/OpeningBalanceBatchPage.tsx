import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { ConfirmDialog } from '@/components/shared/feedback/ConfirmDialog'
import { QueryErrorState } from '@/components/shared/feedback/QueryErrorState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { openingBalanceApi } from '../services/openingBalanceApi'
import { formatCurrency, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { useOBBatch, useOBMutations } from '../hooks/useOpeningBalance'
import { OB_STATUS_BADGE } from '../obStatusBadge'
import { obMessageText, type OBLine, type OBPreview } from '../types/openingBalance.types'

interface EditableLine {
  account_id: number
  account_code: string | null
  account_name: string | null
  debit: number
  credit: number
  description: string
}

function toSystemLine(l: OBLine) {
  return {
    account_code: l.account_code ?? l.account?.account_code ?? null,
    account_name: l.account_name ?? l.account?.account_name ?? `Akun #${l.account_id}`,
    debit: Number(l.debit ?? 0),
    credit: Number(l.credit ?? 0),
    description: l.description ?? '',
  }
}

export default function OpeningBalanceBatchPage() {
  const { batchId } = useParams()
  const id = Number(batchId)
  const { toast } = useToast()
  const { data, isLoading, isError, error, refetch } = useOBBatch(id)
  const { replaceLines, validate, post, lock, reopen } = useOBMutations()
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const draftKey = `seaside-erp:ob-draft:company-${activeCompanyId ?? 'none'}:batch-${id}`

  const batch = data?.data
  const status = batch?.status ?? 'draft'
  const isEditable = status === 'draft' || status === 'reopened'

  const [lines, setLines] = useState<EditableLine[]>([])
  const [reopenOpen, setReopenOpen] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [preview, setPreview] = useState<OBPreview | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const hydratedRef = useRef(false)

  const systemLines = (batch?.lines ?? []).filter((l) => l.is_system_generated).map(toSystemLine)

  // Muat manual lines dari server; pulihkan draft lokal bila ada (A13-089).
  useEffect(() => {
    if (!batch?.lines || hydratedRef.current) return
    hydratedRef.current = true

    const serverLines: EditableLine[] = batch.lines
      .filter((l) => !l.is_system_generated)
      .map((l) => ({
        account_id: l.account_id,
        account_code: l.account_code ?? l.account?.account_code ?? null,
        account_name: l.account_name ?? l.account?.account_name ?? null,
        debit: Number(l.debit ?? 0),
        credit: Number(l.credit ?? 0),
        description: l.description ?? '',
      }))

    let target = serverLines
    if (isEditable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(draftKey)
        if (raw) {
          const parsed = JSON.parse(raw) as EditableLine[]
          if (Array.isArray(parsed) && parsed.length > 0) target = parsed
        }
      } catch { /* ignore corrupt draft */ }
    }
    // Defer setState agar tidak memicu cascading render saat hydrate.
    const timer = window.setTimeout(() => setLines(target), 0)
    return () => window.clearTimeout(timer)
  }, [batch, draftKey, isEditable])

  // Simpan draft lokal saat editable & dirty.
  useEffect(() => {
    if (!isEditable || !hydratedRef.current || typeof window === 'undefined') return
    try { window.localStorage.setItem(draftKey, JSON.stringify(lines)) } catch { /* quota */ }
  }, [lines, draftKey, isEditable])

  const clearDraft = () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey)
  }

  const totalDebit = [...lines, ...systemLines].reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = [...lines, ...systemLines].reduce((s, l) => s + (l.credit || 0), 0)
  const difference = totalDebit - totalCredit

  const addLine = (accountId: number | null, opt?: { code?: string; name?: string }) => {
    if (!accountId) return
    if (lines.some((l) => l.account_id === accountId)) { toast.error('Akun sudah ada di daftar.'); return }
    setLines((prev) => [...prev, { account_id: accountId, account_code: opt?.code ?? null, account_name: opt?.name ?? null, debit: 0, credit: 0, description: '' }])
  }

  const updateLine = (idx: number, field: keyof EditableLine, value: string | number) => {
    setLines((prev) => prev.map((l, i) => {
      if (i !== idx) return l
      if (field === 'debit') return { ...l, debit: Number(value) || 0, credit: 0 }
      if (field === 'credit') return { ...l, credit: Number(value) || 0, debit: 0 }
      return { ...l, [field]: value }
    }))
  }

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx))

  const handleSaveLines = async () => {
    try {
      await replaceLines.mutateAsync({ batchId: id, lines: lines.map((l) => ({ account_id: l.account_id, debit: l.debit || undefined, credit: l.credit || undefined, description: l.description || undefined })) })
      clearDraft()
      toast.success('Baris saldo awal disimpan.')
    } catch { toast.error('Gagal menyimpan baris.') }
  }

  const handleValidate = async () => {
    try { await validate.mutateAsync(id); toast.success('Batch tervalidasi.') }
    catch { toast.error('Validasi gagal. Periksa keseimbangan debit/kredit.') }
  }

  const handlePreview = async () => {
    try { const res = await openingBalanceApi.preview(id); setPreview(res.data); setPreviewOpen(true) }
    catch { toast.error('Gagal memuat preview.') }
  }

  const handlePost = async () => {
    try { await post.mutateAsync(id); clearDraft(); toast.success('Saldo awal diposting.'); setPostOpen(false) }
    catch { toast.error('Gagal memposting saldo awal.') }
  }

  const handleLock = async () => {
    try { await lock.mutateAsync(id); toast.success('Batch dikunci.'); setLockOpen(false) }
    catch { toast.error('Gagal mengunci batch.') }
  }

  const handleReopen = async (reason?: string) => {
    try { await reopen.mutateAsync({ batchId: id, reason: reason ?? '' }); toast.success('Batch dibuka kembali.'); setReopenOpen(false) }
    catch { toast.error('Gagal membuka kembali batch.') }
  }

  if (isLoading) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal', path: '/opening-balance' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
      </WorkspaceLayout>
    )
  }

  if (isError || !batch) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal', path: '/opening-balance' }, { label: 'Error' }]}>
        <QueryErrorState error={error} onRetry={() => void refetch()} title="Batch saldo awal gagal dimuat" />
      </WorkspaceLayout>
    )
  }

  const badge = OB_STATUS_BADGE[status]

  return (
    <WorkspaceLayout
      title={batch.batch_number}
      breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal', path: '/opening-balance' }, { label: batch.batch_number }]}
      action={<Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', badge.className)}>{badge.label}</Badge>}
    >
      <div className="space-y-4 pb-20">
        {isEditable && (
          <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-3">
            <span className="text-[12px] font-medium text-[#64748b]">Tambah akun:</span>
            <div className="w-72">
              <SearchableSelect
                value={null}
                onChange={(v, opt) => addLine(v, opt ? { code: opt.sublabel, name: opt.label } : undefined)}
                onSearch={(q) => coaApi.search(q, { isActive: true })}
                placeholder="Cari akun..."
                ariaLabel="Tambah akun saldo awal"
                size="sm"
              />
            </div>
          </div>
        )}

        <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
          <table className="w-full text-[12px]">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama Akun</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Debit</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kredit</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Keterangan</th>
                {isEditable && <th className="w-10 px-3 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {lines.map((line, idx) => (
                <tr key={`${line.account_id}-${idx}`} className="hover:bg-[#f8fafc]">
                  <td className="px-3 py-2 font-medium text-[#5c9ead]">{line.account_code ?? '-'}</td>
                  <td className="px-3 py-2 text-[#334155]">{line.account_name ?? `Akun #${line.account_id}`}</td>
                  <td className="px-3 py-1.5 text-right">
                    {isEditable ? <Input type="number" min={0} value={line.debit || ''} onChange={(e) => updateLine(idx, 'debit', e.target.value)} aria-label={`Debit ${line.account_name ?? line.account_id}`} className="h-8 text-right text-[12px] tabular-nums" placeholder="0" /> : <span className="tabular-nums">{formatCurrency(line.debit)}</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {isEditable ? <Input type="number" min={0} value={line.credit || ''} onChange={(e) => updateLine(idx, 'credit', e.target.value)} aria-label={`Kredit ${line.account_name ?? line.account_id}`} className="h-8 text-right text-[12px] tabular-nums" placeholder="0" /> : <span className="tabular-nums">{formatCurrency(line.credit)}</span>}
                  </td>
                  <td className="px-3 py-1.5">
                    {isEditable ? <Input value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} aria-label={`Keterangan ${line.account_name ?? line.account_id}`} className="h-8 text-[12px]" placeholder="Keterangan..." /> : <span className="text-[#64748b]">{line.description || '-'}</span>}
                  </td>
                  {isEditable && (
                    <td className="px-3 py-1.5 text-center">
                      <Button type="button" variant="ghost" size="sm" aria-label={`Hapus baris ${line.account_name ?? line.account_id}`} className="h-7 w-7 p-0 text-[#64748b] hover:text-red-500" onClick={() => removeLine(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  )}
                </tr>
              ))}
              {/* System lines (read-only) ikut diperlihatkan & dihitung (A13-087). */}
              {systemLines.map((line, idx) => (
                <tr key={`sys-${idx}`} className="bg-[#f8fafc]/60">
                  <td className="px-3 py-2 font-medium text-[#5c9ead]">{line.account_code ?? '-'}</td>
                  <td className="px-3 py-2 text-[#334155]">
                    {line.account_name}
                    <Badge className="ml-2 bg-[#475569] text-white hover:bg-[#475569]">Sistem</Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(line.debit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(line.credit)}</td>
                  <td className="px-3 py-2 text-[#64748b]">{line.description || '-'}</td>
                  {isEditable && <td className="px-3 py-2" />}
                </tr>
              ))}
              {lines.length === 0 && systemLines.length === 0 && (
                <tr><td colSpan={isEditable ? 6 : 5} className="py-8 text-center text-[#94a3b8]">Belum ada baris. {isEditable ? 'Tambahkan akun di atas.' : ''}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="min-w-72 space-y-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
            <div className="flex justify-between"><span className="text-[#64748b]">Total Debit</span><span className="tabular-nums font-medium">{formatCurrency(totalDebit)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748b]">Total Kredit</span><span className="tabular-nums font-medium">{formatCurrency(totalCredit)}</span></div>
            <div className="flex justify-between border-t border-[#e2e8f0] pt-1"><span className="font-semibold text-[#334155]">Selisih</span><span className={cn('tabular-nums font-semibold', Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-600')}>{formatCurrency(difference)}</span></div>
          </div>
        </div>
      </div>

      {/* Fixed action bar (A13-090) */}
      <FixedBottomBar left={<span>{batch.batch_number} · {badge.label}</span>}>
        {isEditable && (
          <PermissionGuard permission="opening_balance.manage" fallback={null}>
            <Button type="button" variant="outline" onClick={() => void handleSaveLines()} disabled={replaceLines.isPending} className="h-9 text-[13px]">{replaceLines.isPending ? 'Menyimpan...' : 'Simpan Baris'}</Button>
          </PermissionGuard>
        )}
        {isEditable && (
          <PermissionGuard permission="opening_balance.validate" fallback={null}>
            <Button type="button" onClick={() => void handleValidate()} disabled={validate.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">{validate.isPending ? 'Memvalidasi...' : 'Validasi'}</Button>
          </PermissionGuard>
        )}
        {status === 'validated' && (
          <>
            <Button type="button" variant="outline" onClick={() => void handlePreview()} className="h-9 text-[13px]">Lihat Preview</Button>
            <PermissionGuard permission="opening_balance.post" fallback={null}>
              <Button type="button" onClick={() => setPostOpen(true)} disabled={post.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">Posting</Button>
            </PermissionGuard>
          </>
        )}
        {status === 'posted' && (
          <PermissionGuard permission="opening_balance.lock" fallback={null}>
            <Button type="button" onClick={() => setLockOpen(true)} disabled={lock.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">Kunci</Button>
          </PermissionGuard>
        )}
        {(status === 'posted' || status === 'locked') && (
          <PermissionGuard permission="opening_balance.reopen" fallback={null}>
            <Button type="button" variant="outline" onClick={() => setReopenOpen(true)} className="h-9 text-[13px]">Buka Kembali</Button>
          </PermissionGuard>
        )}
      </FixedBottomBar>

      {/* Confirmations (A13-091/093) */}
      <ConfirmDialog
        open={postOpen} onOpenChange={setPostOpen}
        title="Posting Saldo Awal"
        description="Jurnal pembuka akan dibuat dari saldo awal ini. Lanjutkan?"
        confirmLabel="Posting" isLoading={post.isPending}
        onConfirm={() => void handlePost()}
      />
      <ConfirmDialog
        open={lockOpen} onOpenChange={setLockOpen}
        title="Kunci Saldo Awal"
        description="Batch tidak dapat diubah setelah dikunci kecuali dibuka kembali. Lanjutkan?"
        confirmLabel="Kunci" isLoading={lock.isPending}
        onConfirm={() => void handleLock()}
      />
      <ConfirmDialog
        open={reopenOpen} onOpenChange={setReopenOpen}
        title="Buka Kembali Saldo Awal"
        description="Membuka kembali akan membalik jurnal pembuka agar batch dapat dikoreksi. Berikan alasan untuk jejak audit."
        confirmLabel="Buka Kembali" requireReason reasonLabel="Alasan buka kembali"
        isLoading={reopen.isPending}
        onConfirm={(reason) => void handleReopen(reason)}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Preview Saldo Awal</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3 text-[13px]">
              <div className="space-y-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[12px]">
                <div className="flex justify-between"><span className="text-[#64748b]">Total Debit</span><span className="tabular-nums font-medium">{formatCurrency(preview.total_debit)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Total Kredit</span><span className="tabular-nums font-medium">{formatCurrency(preview.total_credit)}</span></div>
                <div className="flex justify-between border-t border-[#e2e8f0] pt-1"><span className="font-semibold">Selisih</span><span className={cn('tabular-nums font-semibold', Math.abs(preview.difference) < 0.01 ? 'text-green-700' : 'text-red-600')}>{formatCurrency(preview.difference)}</span></div>
              </div>
              {preview.blocking_errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-600">
                  <p className="font-semibold">Error:</p>
                  <ul className="list-inside list-disc">{preview.blocking_errors.map((e, i) => <li key={i}>{obMessageText(e)}</li>)}</ul>
                </div>
              )}
              {preview.warnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-700">
                  <p className="font-semibold">Peringatan:</p>
                  <ul className="list-inside list-disc">{preview.warnings.map((w, i) => <li key={i}>{obMessageText(w)}</li>)}</ul>
                </div>
              )}
              {preview.validation.valid && preview.blocking_errors.length === 0 && (
                <p className="text-[12px] text-green-700">✓ Saldo awal valid dan siap diposting.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)} className="h-9 text-[13px]">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
