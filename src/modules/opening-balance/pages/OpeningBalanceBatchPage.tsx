import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { openingBalanceApi } from '../services/openingBalanceApi'
import { formatCurrency, cn } from '@/lib/utils'
import { useOBBatch, useOBMutations } from '../hooks/useOpeningBalance'
import type { OBBatchStatus, OBPreview } from '../types/openingBalance.types'
import { getApiErrorMessage } from '@/lib/apiError'

const STATUS_BADGE: Record<OBBatchStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]' },
  validated: { label: 'Tervalidasi', className: 'bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE]' },
  posted: { label: 'Diposting', className: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]' },
  locked: { label: 'Dikunci', className: 'bg-[#E0E7FF] text-[#3730A3] hover:bg-[#E0E7FF]' },
  voided: { label: 'Dibatalkan', className: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]' },
}

interface EditableLine {
  account_id: number
  account_code: string | null
  account_name: string | null
  debit: number
  credit: number
  description: string
}

export default function OpeningBalanceBatchPage() {
  const { batchId } = useParams()
  const id = Number(batchId)
  const { toast } = useToast()
  const { data, isLoading } = useOBBatch(id)
  const { replaceLines, validate, post, lock, reopen } = useOBMutations()

  const batch = data?.data
  const status = batch?.status ?? 'draft'
  const isDraft = status === 'draft'

  const [lines, setLines] = useState<EditableLine[]>([])
  const [reopenOpen, setReopenOpen] = useState(false)
  const [preview, setPreview] = useState<OBPreview | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (batch?.lines) {
      const batchLines = batch.lines
      const timer = window.setTimeout(() => {
        setLines(batchLines.filter((l) => !l.is_system_generated).map((l) => ({
          account_id: l.account_id,
          account_code: l.account_code ?? l.account?.account_code ?? null,
          account_name: l.account_name ?? l.account?.account_name ?? null,
          debit: Number(l.debit ?? 0),
          credit: Number(l.credit ?? 0),
          description: l.description ?? '',
        })))
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [batch])

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
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

  const lineColumns: LineItemColumn<EditableLine>[] = [
    {
      id: 'account_code',
      header: 'Kode',
      width: 90,
      render: ({ item }) => (
        <span className="text-[12px] font-medium text-[#5c9ead]">{item.account_code ?? '-'}</span>
      ),
    },
    {
      id: 'account_name',
      header: 'Nama Akun',
      width: 200,
      render: ({ item }) => (
        <span className="text-[12px] text-[#334155]">{item.account_name ?? `Akun #${item.account_id}`}</span>
      ),
    },
    {
      id: 'debit',
      header: 'Debit',
      width: 130,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px] tabular-nums">{formatCurrency(item.debit)}</span>
        ) : (
          <Input
            type="number"
            min={0}
            value={item.debit || ''}
            onChange={(e) => onUpdate('debit', e.target.value)}
            className="h-8 text-right text-[12px] tabular-nums"
            placeholder="0"
          />
        ),
    },
    {
      id: 'credit',
      header: 'Kredit',
      width: 130,
      align: 'right',
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px] tabular-nums">{formatCurrency(item.credit)}</span>
        ) : (
          <Input
            type="number"
            min={0}
            value={item.credit || ''}
            onChange={(e) => onUpdate('credit', e.target.value)}
            className="h-8 text-right text-[12px] tabular-nums"
            placeholder="0"
          />
        ),
    },
    {
      id: 'description',
      header: 'Keterangan',
      width: 200,
      render: ({ item, isReadOnly, onUpdate }) =>
        isReadOnly ? (
          <span className="text-[12px] text-[#64748b]">{item.description || '-'}</span>
        ) : (
          <Input
            value={item.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            className="h-8 text-[12px]"
            placeholder="Keterangan..."
          />
        ),
    },
  ]

  const handleSaveLines = async () => {
    try {
      await replaceLines.mutateAsync({ batchId: id, lines: lines.map((l) => ({ account_id: l.account_id, debit: l.debit || undefined, credit: l.credit || undefined, description: l.description || undefined })) })
      toast.success('Baris saldo awal disimpan.')
    } catch (saveError) { toast.error(getApiErrorMessage(saveError, 'Gagal menyimpan baris.')) }
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
    if (!confirm('Posting saldo awal? Jurnal pembuka akan dibuat.')) return
    try { await post.mutateAsync(id); toast.success('Saldo awal diposting.') }
    catch { toast.error('Gagal memposting saldo awal.') }
  }

  const handleLock = async () => {
    if (!confirm('Kunci batch saldo awal? Tidak bisa diubah setelah dikunci kecuali dibuka kembali.')) return
    try { await lock.mutateAsync(id); toast.success('Batch dikunci.') }
    catch { toast.error('Gagal mengunci batch.') }
  }

  const handleReopen = async (reason: string) => {
    try { await reopen.mutateAsync({ batchId: id, reason }); toast.success('Batch dibuka kembali.'); setReopenOpen(false) }
    catch { toast.error('Gagal membuka kembali batch.') }
  }

  if (isLoading || !batch) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal', path: '/opening-balance' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
      </WorkspaceLayout>
    )
  }

  const badge = STATUS_BADGE[status]

  return (
    <WorkspaceLayout
      title={batch.batch_number}
      breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal', path: '/opening-balance' }, { label: batch.batch_number }]}
      action={<Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', badge.className)}>{badge.label}</Badge>}
    >
      <div className="space-y-4">
        {isDraft && (
          <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-3">
            <span className="text-[12px] font-medium text-[#64748b]">Tambah akun:</span>
            <div className="w-72">
              <SearchableSelect
                value={null}
                onChange={(v, opt) => addLine(v, opt ? { code: opt.sublabel, name: opt.label } : undefined)}
                onSearch={coaApi.search}
                placeholder="Cari akun..."
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Baris ditambahkan lewat `SearchableSelect` di atas (bukan baris kosong),
            jadi tombol "+ Tambah Item" bawaan tabel sengaja tidak dipakai. */}
        <LineItemsTable<EditableLine>
          items={lines}
          columns={lineColumns}
          onRemove={removeLine}
          onUpdate={(index, field, value) => updateLine(index, field as keyof EditableLine, value as string | number)}
          isReadOnly={!isDraft}
          emptyLabel={isDraft ? 'Belum ada baris. Tambahkan akun di atas.' : 'Belum ada baris.'}
          footer={(_items, cellCount) => (
            <>
              <tr>
                <td colSpan={cellCount - 4} className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                  Total
                </td>
                <td className="px-2.5 py-2 text-right text-[12px] font-medium tabular-nums text-[#334155]">{formatCurrency(totalDebit)}</td>
                <td className="px-2.5 py-2 text-right text-[12px] font-medium tabular-nums text-[#334155]">{formatCurrency(totalCredit)}</td>
                <td colSpan={2} />
              </tr>
              <tr className="border-t border-[#e2e8f0]">
                <td colSpan={cellCount - 4} className="px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#334155]">
                  Selisih
                </td>
                <td
                  colSpan={2}
                  className={cn(
                    'px-2.5 py-2 text-right text-[12px] font-semibold tabular-nums',
                    Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-600',
                  )}
                >
                  {formatCurrency(difference)}
                </td>
                <td colSpan={2} />
              </tr>
            </>
          )}
        />

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2">
          {isDraft && (
            <PermissionGuard permission="opening_balance.manage" fallback={null}>
              <Button type="button" variant="outline" onClick={() => void handleSaveLines()} disabled={replaceLines.isPending} className="h-9 text-[13px]">{replaceLines.isPending ? 'Menyimpan...' : 'Simpan Baris'}</Button>
            </PermissionGuard>
          )}
          {isDraft && (
            <PermissionGuard permission="opening_balance.validate" fallback={null}>
              <Button type="button" onClick={() => void handleValidate()} disabled={validate.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">{validate.isPending ? 'Memvalidasi...' : 'Validasi'}</Button>
            </PermissionGuard>
          )}
          {status === 'validated' && (
            <>
              <Button type="button" variant="outline" onClick={() => void handlePreview()} className="h-9 text-[13px]">Lihat Preview</Button>
              <PermissionGuard permission="opening_balance.post" fallback={null}>
                <Button type="button" onClick={() => void handlePost()} disabled={post.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">{post.isPending ? 'Memposting...' : 'Posting'}</Button>
              </PermissionGuard>
            </>
          )}
          {status === 'posted' && (
            <PermissionGuard permission="opening_balance.lock" fallback={null}>
              <Button type="button" onClick={() => void handleLock()} disabled={lock.isPending} className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]">{lock.isPending ? 'Mengunci...' : 'Kunci'}</Button>
            </PermissionGuard>
          )}
          {(status === 'posted' || status === 'locked') && (
            <PermissionGuard permission="opening_balance.reopen" fallback={null}>
              <Button type="button" variant="outline" onClick={() => setReopenOpen(true)} className="h-9 text-[13px]">Buka Kembali</Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      <VoidConfirmDialog isOpen={reopenOpen} onClose={() => setReopenOpen(false)} onConfirm={(reason) => void handleReopen(reason)} documentNumber={batch.batch_number} isLoading={reopen.isPending} />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Preview Saldo Awal</DialogTitle><DialogDescription className="text-[13px] text-[#64748b]">Tinjau ringkasan saldo awal sebelum diposting.</DialogDescription></DialogHeader>
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
                  <ul className="list-inside list-disc">{preview.blocking_errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}
              {preview.warnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-700">
                  <p className="font-semibold">Peringatan:</p>
                  <ul className="list-inside list-disc">{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
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
